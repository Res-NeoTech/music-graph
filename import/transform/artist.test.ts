import { describe, expect, it } from "vitest"

import { MBID, yeArtist } from "@/tests/fixtures/musicbrainz"

import { toArtistRow } from "./artist"

describe("toArtistRow", () => {
  it("convertit un artiste complet (lookup)", () => {
    expect(toArtistRow(yeArtist())).toEqual({
      mbid: MBID.YE,
      name: "Ye",
      sortingName: "Ye",
      type: "person",
      country: "US",
      startDate: "1977-06-08",
      finishDate: null, // toujours en activité
      disambiguation: "formerly Kanye West",
    })
  })

  it("convertit un artiste lu dans une relation : pas de dates", () => {
    const kidsSeeGhosts = yeArtist().relations!.find(
      (r) => r.artist?.id === MBID.KIDS_SEE_GHOSTS
    )!.artist!

    expect(toArtistRow(kidsSeeGhosts)).toEqual({
      mbid: MBID.KIDS_SEE_GHOSTS,
      name: "KIDS SEE GHOSTS",
      sortingName: "KIDS SEE GHOSTS",
      type: "group",
      country: "US",
      startDate: null,
      finishDate: null,
      disambiguation: "Kanye West & Kid Cudi",
    })
  })

  it("stocke null quand MusicBrainz renvoie une chaîne vide", () => {
    const row = toArtistRow({
      id: MBID.YE,
      name: "X",
      "sort-name": "X",
      disambiguation: "",
      country: null,
    })
    expect(row.disambiguation).toBeNull()
    expect(row.country).toBeNull()
    expect(row.type).toBeNull()
  })
})
