import { describe, expect, it } from "vitest"

import type { MbArtistCredit } from "@/import/musicbrainz/types"
import { MBID, mbdtfRelease } from "@/tests/fixtures/musicbrainz"

import { toArtistCreditRows, toCreditRoles } from "./artist-credit"
import type { ArtistCreditRow } from "./types"

/** « A feat. B » → crédit MusicBrainz, les MBID valent "A" et "B" */
const mbCredit = (
  ...parts: [name: string, joinphrase: string][]
): MbArtistCredit[] =>
  parts.map(([name, joinphrase]) => ({
    name,
    joinphrase,
    artist: { id: name, name, "sort-name": name },
  }))

/** Même chose, directement en lignes (entrée de toCreditRoles) */
const rows = (
  ...parts: [name: string, joinPhrase: string][]
): ArtistCreditRow[] =>
  parts.map(([name, joinPhrase], index) => ({
    artistMbid: name,
    position: index + 1,
    creditedName: name,
    joinPhrase,
  }))

describe("toArtistCreditRows", () => {
  it("numérote les artistes et garde les join phrases", () => {
    expect(
      toArtistCreditRows(mbCredit(["Kanye West", " feat. "], ["Jay-Z", ""]))
    ).toEqual([
      {
        artistMbid: "Kanye West",
        position: 1,
        creditedName: "Kanye West",
        joinPhrase: " feat. ",
      },
      {
        artistMbid: "Jay-Z",
        position: 2,
        creditedName: "Jay-Z",
        joinPhrase: "",
      },
    ])
  })

  it("ne garde qu'une fois un artiste cité deux fois", () => {
    const result = toArtistCreditRows(
      mbCredit(["A", " & "], ["B", " & "], ["A", ""])
    )
    expect(result.map((r) => r.artistMbid)).toEqual(["A", "B"])
  })
})

// Tests de toCreditRoles(), à faire passer : npx vitest run import/transform/artist-credit

describe("toCreditRoles", () => {
  it("un seul artiste est principal", () => {
    expect(toCreditRoles(rows(["A", ""]))).toEqual([
      { artistMbid: "A", role: "main" },
    ])
  })

  it("« A feat. B » : B est invité", () => {
    expect(toCreditRoles(rows(["A", " feat. "], ["B", ""]))).toEqual([
      { artistMbid: "A", role: "main" },
      { artistMbid: "B", role: "featuring" },
    ])
  })

  it("« A & B » : deux artistes principaux", () => {
    expect(
      toCreditRoles(rows(["A", " & "], ["B", ""])).map((r) => r.role)
    ).toEqual(["main", "main"])
  })

  it("« A & B feat. C » : seul C est invité", () => {
    const result = toCreditRoles(
      rows(["A", " & "], ["B", " feat. "], ["C", ""])
    )
    expect(result.map((r) => r.role)).toEqual(["main", "main", "featuring"])
  })

  it("« A feat. B & C » : tous les artistes après « feat. » sont invités", () => {
    const result = toCreditRoles(
      rows(["A", " feat. "], ["B", " & "], ["C", ""])
    )
    expect(result.map((r) => r.role)).toEqual([
      "main",
      "featuring",
      "featuring",
    ])
  })

  it.each([" ft. ", " Feat. ", " featuring ", " FEATURING ", " (feat. "])(
    "reconnaît « %s »",
    (joinPhrase) => {
      const result = toCreditRoles(rows(["A", joinPhrase], ["B", ""]))
      expect(result[1]).toEqual({ artistMbid: "B", role: "featuring" })
    }
  )

  it.each([" x ", " with ", " vs. ", ", "])(
    "« %s » n'est pas un featuring",
    (joinPhrase) => {
      const result = toCreditRoles(rows(["A", joinPhrase], ["B", ""]))
      expect(result[1].role).toBe("main")
    }
  )

  it("trie par position avant d'analyser", () => {
    const [a, b] = rows(["A", " feat. "], ["B", ""])
    expect(toCreditRoles([b, a])).toEqual([
      { artistMbid: "A", role: "main" },
      { artistMbid: "B", role: "featuring" },
    ])
  })

  it("Gorgeous : « Kanye West feat. Kid Cudi & Raekwon » (vraies données)", () => {
    const gorgeous = mbdtfRelease().media[0].tracks![1].recording

    const roles = toCreditRoles(toArtistCreditRows(gorgeous["artist-credit"]!))

    expect(roles).toEqual([
      { artistMbid: MBID.YE, role: "main" },
      { artistMbid: MBID.KID_CUDI, role: "featuring" },
      { artistMbid: MBID.RAEKWON, role: "featuring" },
    ])
  })
})
