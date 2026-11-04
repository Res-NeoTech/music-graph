import { describe, expect, it } from "vitest"

import type { MbRelation } from "@/import/musicbrainz/types"
import { MBID, mbdtfRelease, ROLE_CODES } from "@/tests/fixtures/musicbrainz"

import { transformRelease } from "./release"

const MASTERING: MbRelation = {
  type: "mastering",
  "target-type": "artist",
  direction: "backward",
  attributes: [],
  artist: {
    id: "0e2b3fd2-7a2d-4b2b-9c4e-2f6c1f0c3a11",
    name: "Mastering Engineer",
    "sort-name": "Engineer, Mastering",
    type: "Person",
  },
}

const mbdtf = () => transformRelease(mbdtfRelease(), { roles: ROLE_CODES })

describe("transformRelease", () => {
  it("produit la ligne releases", () => {
    expect(mbdtf().release).toEqual({
      mbid: MBID.MBDTF,
      releaseGroupMbid: MBID.MBDTF_GROUP,
      title: "My Beautiful Dark Twisted Fantasy",
      type: "album",
      releaseDate: "2010-11-19",
      hasCoverArt: true,
    })
  })

  it("garde le nom imprimé sur la pochette, distinct du nom actuel", () => {
    const data = mbdtf()

    expect(data.releaseArtists).toEqual([
      {
        releaseMbid: MBID.MBDTF,
        artistMbid: MBID.YE,
        position: 1,
        creditedName: "Kanye West",
        joinPhrase: "",
      },
    ])
    expect(data.artists.find((a) => a.mbid === MBID.YE)?.name).toBe("Ye")
  })

  it("produit la tracklist des deux disques (CD + DVD)", () => {
    const data = mbdtf()

    expect(data.tracks.map((t) => [t.discNumber, t.position, t.title])).toEqual(
      [
        [1, 1, "Dark Fantasy"],
        [1, 2, "Gorgeous"],
        [1, 3, "Power"],
        [2, 1, "Runaway"],
      ]
    )
    expect(data.recordings).toHaveLength(4)
    // le titre imprimé sur la piste diffère de celui du morceau
    expect(data.recordings[3].title).toBe(
      "Runway (film) (album version, edited)"
    )
  })

  it("garde le crédit d'artiste « A feat. B & C » des morceaux", () => {
    const gorgeous = mbdtf().recordingArtists.filter(
      (r) => r.recordingMbid === MBID.GORGEOUS
    )

    expect(
      gorgeous.map((r) => [
        r.artistMbid,
        r.position,
        r.creditedName,
        r.joinPhrase,
      ])
    ).toEqual([
      [MBID.YE, 1, "Kanye West", " feat. "],
      [MBID.KID_CUDI, 2, "Kid Cudi", " & "],
      [MBID.RAEKWON, 3, "Raekwon", ""],
    ])
  })

  it("liste chaque artiste cité une seule fois", () => {
    const mbids = mbdtf().artists.map((a) => a.mbid)

    expect(new Set(mbids).size).toBe(mbids.length)
    // crédits d'artiste, musiciens, producteurs, ingénieurs, auteurs
    expect(mbids).toHaveLength(44)
    expect(mbids).toEqual(expect.arrayContaining([MBID.KID_CUDI, MBID.RAEKWON]))
  })

  it("rattache les crédits aux morceaux", () => {
    const data = mbdtf()

    // 28 + 29 + 32 + 7 (le film n'a que ses auteurs)
    expect(data.credits).toHaveLength(96)
    for (const credit of data.credits) {
      expect(ROLE_CODES.has(credit.roleCode)).toBe(true)
    }
  })

  it("recopie les crédits de la release sur chaque morceau, si demandé", () => {
    const release = mbdtfRelease()
    release.relations = [MASTERING]

    const copied = transformRelease(release, { roles: ROLE_CODES })
    const ignored = transformRelease(release, {
      roles: ROLE_CODES,
      copyReleaseCredits: false,
    })

    const masteringOf = (credits: typeof copied.credits) =>
      credits
        .filter((c) => c.roleCode === "mastering")
        .map((c) => c.recordingMbid)
    expect(masteringOf(copied.credits)).toEqual(
      copied.recordings.map((r) => r.mbid)
    )
    expect(copied.artists.map((a) => a.mbid)).toContain(MASTERING.artist!.id)
    expect(masteringOf(ignored.credits)).toEqual([])
  })

  it("traite une seule fois un morceau présent deux fois sur la release", () => {
    const release = mbdtfRelease()
    const tracks = release.media[0].tracks!
    tracks.push({
      ...tracks[0],
      id: "a1b2c3d4-0000-4000-8000-000000000004",
      position: 4,
    })

    const data = transformRelease(release, { roles: ROLE_CODES })

    expect(data.tracks).toHaveLength(5)
    expect(data.recordings).toHaveLength(4)
    expect(data.credits).toHaveLength(96)
  })
})
