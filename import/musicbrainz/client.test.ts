import { describe, expect, it, vi } from "vitest"

import { buildUserAgent, MusicBrainzClient, MusicBrainzError } from "./client"

const UA = "MusicGraph/0.0.1 ( test@example.com )"
const YE = "164f0d73-1234-4e2c-8743-d77bf2191051"
const MBDTF = "cd474271-bd7a-4d53-ba9e-e9d5bd7958cb" // My Beautiful Dark Twisted Fantasy

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), { status, headers })
}

/**
 * Client branché sur une fausse horloge et un faux fetch : `sleep` avance
 * l'horloge au lieu d'attendre, et chaque appel note l'heure à laquelle il part.
 */
function setup(
  respond: (url: URL) => Response | Promise<Response>,
  options: { maxRetries?: number } = {}
) {
  let clock = 0
  const sleep = vi.fn(async (ms: number) => {
    clock += ms
  })
  const calls: { url: URL; headers: Headers; at: number }[] = []
  const fakeFetch = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input))
      calls.push({ url, headers: new Headers(init?.headers), at: clock })
      return respond(url)
    }
  )
  const client = new MusicBrainzClient({
    userAgent: UA,
    fetch: fakeFetch as typeof fetch,
    sleep,
    now: () => clock,
    ...options,
  })
  return { client, calls, sleep, fakeFetch }
}

describe("buildUserAgent", () => {
  it("suit le format exigé par MusicBrainz", () => {
    expect(buildUserAgent("0.0.1", " https://example.org ")).toBe(
      "MusicGraph/0.0.1 ( https://example.org )"
    )
  })

  it("refuse un contact vide", () => {
    expect(() => buildUserAgent("0.0.1", undefined)).toThrow(
      /MUSICBRAINZ_CONTACT/
    )
    expect(() => buildUserAgent("0.0.1", "  ")).toThrow(/MUSICBRAINZ_CONTACT/)
  })
})

describe("MusicBrainzClient", () => {
  it("envoie le User-Agent et demande du JSON", async () => {
    const { client, calls } = setup(() => json({ id: YE }))

    const artist = await client.getArtist(YE)

    expect(artist.id).toBe(YE)
    expect(calls).toHaveLength(1)
    const { url, headers } = calls[0]
    expect(url.origin + url.pathname).toBe(
      `https://musicbrainz.org/ws/2/artist/${YE}`
    )
    expect(url.searchParams.get("inc")).toBe("artist-rels")
    expect(url.searchParams.get("fmt")).toBe("json")
    expect(headers.get("User-Agent")).toBe(UA)
    expect(headers.get("Accept")).toBe("application/json")
  })

  it("demande les relations des morceaux et des œuvres pour une release", async () => {
    const { client, calls } = setup(() => json({ id: MBDTF }))

    await client.getRelease(MBDTF)

    const inc = calls[0].url.searchParams.get("inc")!.split(" ")
    expect(inc).toEqual(
      expect.arrayContaining([
        "artist-credits",
        "recordings",
        "release-groups",
        "artist-rels",
        "recording-level-rels",
        "work-rels",
        "work-level-rels",
      ])
    )
    // « + » entre les valeurs, comme dans la documentation de l'API
    expect(calls[0].url.search).toContain("inc=artist-credits+recordings")
  })

  it("refuse un MBID invalide sans appeler l'API", async () => {
    const { client, fakeFetch } = setup(() => json({}))

    await expect(client.getArtist("../release/x")).rejects.toThrow(
      /MBID invalide/
    )
    expect(fakeFetch).not.toHaveBeenCalled()
  })

  it("espace les requêtes d'au moins une seconde", async () => {
    const { client, calls } = setup(() => json({ id: YE }))

    await client.getArtist(YE)
    await client.getArtist(YE)
    await client.getArtist(YE)

    expect(calls.map((c) => c.at)).toEqual([0, 1000, 2000])
  })

  it("n'envoie jamais deux requêtes en parallèle", async () => {
    let answerFirst!: (response: Response) => void
    const { client, fakeFetch } = setup((url) =>
      url.pathname.includes("artist")
        ? new Promise<Response>((resolve) => (answerFirst = resolve))
        : json({ id: MBDTF })
    )

    // les deux appels sont lancés en même temps
    const artist = client.getArtist(YE)
    const release = client.getRelease(MBDTF)
    await vi.waitFor(() => expect(fakeFetch).toHaveBeenCalledTimes(1))

    // la 2e requête attend que la 1re ait répondu
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(fakeFetch).toHaveBeenCalledTimes(1)

    answerFirst(json({ id: YE }))
    await expect(artist).resolves.toEqual({ id: YE })
    await expect(release).resolves.toEqual({ id: MBDTF })
    expect(fakeFetch).toHaveBeenCalledTimes(2)
  })

  it("réessaie après un 503 en respectant Retry-After", async () => {
    const responses = [
      json({ error: "rate limited" }, 503, { "Retry-After": "3" }),
      json({ id: YE }),
    ]
    const { client, calls } = setup(() => responses.shift()!)

    await expect(client.getArtist(YE)).resolves.toEqual({ id: YE })

    expect(calls).toHaveLength(2)
    expect(calls[1].at - calls[0].at).toBeGreaterThanOrEqual(3000)
  })

  it("abandonne après le nombre maximal de tentatives", async () => {
    const { client, calls } = setup(() => json({}, 503), { maxRetries: 2 })

    const error = await client.getArtist(YE).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(MusicBrainzError)
    expect((error as MusicBrainzError).status).toBe(503)
    expect(calls).toHaveLength(3) // 1 essai + 2 nouvelles tentatives
    // attente doublée à chaque fois : 2 s puis 4 s
    expect(calls[1].at - calls[0].at).toBeGreaterThanOrEqual(2000)
    expect(calls[2].at - calls[1].at).toBeGreaterThanOrEqual(4000)
  })

  it("ne réessaie pas une autre erreur (404)", async () => {
    const { client, calls } = setup(() => json({ error: "Not Found" }, 404))

    await expect(client.getArtist(YE)).rejects.toMatchObject({
      name: "MusicBrainzError",
      status: 404,
    })
    expect(calls).toHaveLength(1)
  })

  it("parcourt toutes les pages d'un browse", async () => {
    const release = (n: number) => ({ id: `release-${n}` })
    const { client, calls } = setup((url) => {
      const offset = Number(url.searchParams.get("offset"))
      const count = Math.min(100, 150 - offset)
      return json({
        "release-count": 150,
        "release-offset": offset,
        releases: Array.from({ length: count }, (_, i) => release(offset + i)),
      })
    })

    const releases = await client.browseReleases(YE, ["album", "ep"])

    expect(releases).toHaveLength(150)
    expect(releases.at(-1)).toEqual(release(149))
    expect(calls.map((c) => c.url.searchParams.get("offset"))).toEqual([
      "0",
      "100",
    ])
    const params = calls[0].url.searchParams
    expect(params.get("artist")).toBe(YE)
    expect(params.get("type")).toBe("album|ep")
    expect(params.get("status")).toBe("official")
    expect(params.get("inc")).toBe("release-groups")
    expect(params.get("limit")).toBe("100")
  })
})
