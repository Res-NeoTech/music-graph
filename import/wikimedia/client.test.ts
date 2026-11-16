import { describe, expect, it, vi } from "vitest"

import { WikimediaClient, WikimediaError } from "./client"

const UA = "MusicGraph/0.0.1 ( test@example.com )"

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), { status, headers })
}

function setup(respond: (url: URL) => Response) {
  const calls: { url: URL; headers: Headers }[] = []
  const sleep = vi.fn(async () => {})
  const fakeFetch = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input))
      calls.push({ url, headers: new Headers(init?.headers) })
      return respond(url)
    }
  )
  const client = new WikimediaClient({
    userAgent: UA,
    fetch: fakeFetch as typeof fetch,
    sleep,
  })
  return { client, calls, sleep, fakeFetch }
}

describe("WikimediaClient", () => {
  it("demande seulement la propriété P18 à Wikidata, avec le User-Agent", async () => {
    const { client, calls } = setup(() => json({ claims: {} }))

    await client.getImageClaims("Q15935")

    const { url, headers } = calls[0]
    expect(url.origin + url.pathname).toBe("https://www.wikidata.org/w/api.php")
    expect(url.searchParams.get("action")).toBe("wbgetclaims")
    expect(url.searchParams.get("entity")).toBe("Q15935")
    expect(url.searchParams.get("property")).toBe("P18")
    expect(url.searchParams.get("format")).toBe("json")
    expect(url.searchParams.get("formatversion")).toBe("2")
    expect(headers.get("User-Agent")).toBe(UA)
  })

  it("demande l'auteur et la licence d'un fichier à Commons", async () => {
    const { client, calls } = setup(() => json({ query: { pages: [] } }))

    await client.getFileInfo("Kanye West (crop 2).jpg")

    const params = calls[0].url.searchParams
    expect(calls[0].url.host).toBe("commons.wikimedia.org")
    expect(params.get("titles")).toBe("File:Kanye West (crop 2).jpg")
    expect(params.get("prop")).toBe("imageinfo")
    expect(params.get("iiextmetadatafilter")).toBe("Artist|LicenseShortName")
  })

  it("refuse un identifiant Wikidata invalide sans appeler l'API", async () => {
    const { client, fakeFetch } = setup(() => json({}))

    await expect(client.getImageClaims("Q1&action=edit")).rejects.toThrow(
      /Wikidata invalide/
    )
    expect(fakeFetch).not.toHaveBeenCalled()
  })

  it("transforme une erreur MediaWiki (statut 200) en exception", async () => {
    const { client } = setup(() =>
      json({ error: { code: "no-such-entity", info: "…" } })
    )

    await expect(client.getImageClaims("Q1")).rejects.toMatchObject({
      name: "WikimediaError",
      message: expect.stringContaining("no-such-entity"),
    })
  })

  it("réessaie après un 429 en respectant Retry-After", async () => {
    const responses = [
      json({}, 429, { "Retry-After": "5" }),
      json({ claims: {} }),
    ]
    const { client, calls, sleep } = setup(() => responses.shift()!)

    await expect(client.getImageClaims("Q1")).resolves.toEqual({ claims: {} })
    expect(calls).toHaveLength(2)
    expect(sleep).toHaveBeenCalledWith(5000)
  })

  it("abandonne après le nombre maximal de tentatives", async () => {
    const { client, calls } = setup(() => json({}, 503))

    const error = await client.getImageClaims("Q1").catch((e: unknown) => e)

    expect(error).toBeInstanceOf(WikimediaError)
    expect(calls).toHaveLength(3) // 1 essai + 2 nouvelles tentatives
  })

  it("suit la redirection d'un élément Wikidata fusionné", async () => {
    // réponses réelles (réduites) pour Q24048992, fusionné dans Q23887796
    const { client, calls } = setup((url) => {
      const action = url.searchParams.get("action")
      const entity = url.searchParams.get("entity")
      if (action === "wbgetentities") {
        return json({
          entities: {
            Q24048992: {
              id: "Q23887796",
              redirects: { from: "Q24048992", to: "Q23887796" },
            },
          },
          success: 1,
        })
      }
      return entity === "Q24048992"
        ? json({ error: { code: "unresolved-redirect", info: "…" } })
        : json({ claims: { P18: [] } })
    })

    await expect(client.getImageClaims("Q24048992")).resolves.toEqual({
      claims: { P18: [] },
    })
    expect(calls.map((c) => c.url.searchParams.get("entity"))).toEqual([
      "Q24048992",
      null, // wbgetentities (paramètre ids)
      "Q23887796",
    ])
    expect(calls[1].url.searchParams.get("redirects")).toBe("yes")
  })

  it("ne réessaie pas une autre erreur (404)", async () => {
    const { client, calls } = setup(() => json({}, 404))

    await expect(client.getFileInfo("X.jpg")).rejects.toMatchObject({
      status: 404,
    })
    expect(calls).toHaveLength(1)
  })
})
