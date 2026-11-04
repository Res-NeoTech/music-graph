import { describe, expect, it, vi } from "vitest"

import { MBID, mbdtfRelease, ROLE_CODES } from "@/tests/fixtures/musicbrainz"

import { artistToGraph, releaseToGraph, toArtistVertex } from "./graph"
import { transformRelease } from "./release"
import type { ArtistRow } from "./types"

// releaseToGraph() appelle toCreditRoles(), testée à part dans
// artist-credit.test.ts. On la remplace ici par une version simple
// (tous les artistes « main ») pour tester ce module seul.
vi.mock("./artist-credit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./artist-credit")>()),
  toCreditRoles: (rows: { artistMbid: string }[]) =>
    rows.map((row) => ({ artistMbid: row.artistMbid, role: "main" })),
}))

const mbdtfGraph = () =>
  releaseToGraph(transformRelease(mbdtfRelease(), { roles: ROLE_CODES }))

const artist = (
  mbid: string,
  name: string,
  type: ArtistRow["type"] = null
): ArtistRow => ({
  mbid,
  name,
  sortingName: name,
  type,
  country: null,
  startDate: null,
  finishDate: null,
  disambiguation: null,
})

describe("releaseToGraph", () => {
  it("crée les sommets avec le MBID comme _key", () => {
    const graph = mbdtfGraph()

    expect(graph.releases).toEqual([
      { _key: MBID.MBDTF, title: "My Beautiful Dark Twisted Fantasy" },
    ])
    expect(graph.recordings).toHaveLength(4)
    expect(graph.artists).toContainEqual({
      _key: MBID.YE,
      name: "Ye",
      type: "person",
    })
  })

  it("relie la release à ses morceaux (contains)", () => {
    const graph = mbdtfGraph()

    expect(graph.contains).toHaveLength(4)
    expect(graph.contains[0]).toEqual({
      _key: `${MBID.MBDTF}_${MBID.DARK_FANTASY}`,
      _from: `releases/${MBID.MBDTF}`,
      _to: `recordings/${MBID.DARK_FANTASY}`,
    })
  })

  it("crée une arête credited par crédit et par artiste du crédit d'artiste", () => {
    const graph = mbdtfGraph()

    // 96 crédits + 6 artistes dans les crédits d'artiste des morceaux :
    // Ye sur les 4, Kid Cudi et Raekwon sur Gorgeous
    expect(graph.credited).toHaveLength(102)
    expect(graph.credited).toContainEqual({
      _key: `${MBID.YE}_${MBID.DARK_FANTASY}_producer`,
      _from: `artists/${MBID.YE}`,
      _to: `recordings/${MBID.DARK_FANTASY}`,
      role: "producer",
    })
    expect(graph.credited.filter((e) => e.role === "main")).toHaveLength(6)
  })

  it("donne des _key uniques et identiques d'un import à l'autre", () => {
    const first = mbdtfGraph()
    const second = mbdtfGraph()

    const keys = first.credited.map((e) => e._key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(second.credited.map((e) => e._key)).toEqual(keys)
  })
})

describe("artistToGraph", () => {
  it("relie chaque membre à son groupe (member_of)", () => {
    const ye = artist(MBID.YE, "Ye", "person")
    const kidsSeeGhosts = artist(
      MBID.KIDS_SEE_GHOSTS,
      "KIDS SEE GHOSTS",
      "group"
    )

    const graph = artistToGraph(
      ye,
      [kidsSeeGhosts, ye],
      [
        {
          groupMbid: MBID.KIDS_SEE_GHOSTS,
          memberMbid: MBID.YE,
          startDate: "2018",
          finishDate: "2022",
          detail: null,
        },
      ]
    )

    expect(graph.artists).toHaveLength(2)
    expect(graph.memberOf).toEqual([
      {
        _key: `${MBID.YE}_${MBID.KIDS_SEE_GHOSTS}`,
        _from: `artists/${MBID.YE}`,
        _to: `artists/${MBID.KIDS_SEE_GHOSTS}`,
      },
    ])
  })
})

describe("toArtistVertex", () => {
  it("omet le type inconnu au lieu d'écrire null", () => {
    expect(toArtistVertex(artist(MBID.YE, "Ye"))).toEqual({
      _key: MBID.YE,
      name: "Ye",
    })
  })
})
