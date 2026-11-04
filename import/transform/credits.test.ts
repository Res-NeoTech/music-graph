import { describe, expect, it } from "vitest"

import type { MbRecording, MbRelation } from "@/import/musicbrainz/types"
import { MBID, mbdtfRelease, ROLE_CODES } from "@/tests/fixtures/musicbrainz"

import { creditRelations, toCredits } from "./credits"

const darkFantasy = () => mbdtfRelease().media[0].tracks![0].recording

const artistRelation = (
  type: string,
  artistId: string,
  attributes: string[] = []
): MbRelation => ({
  type,
  "target-type": "artist",
  direction: "backward",
  attributes,
  artist: { id: artistId, name: artistId, "sort-name": artistId },
})

describe("creditRelations + toCredits", () => {
  it("garde les relations du morceau et celles de l'œuvre (auteurs)", () => {
    const recording = darkFantasy()
    const credits = toCredits(
      recording.id,
      creditRelations(recording, ROLE_CODES)
    )

    // 20 relations du morceau + 8 auteurs de l'œuvre
    expect(credits).toHaveLength(28)
    // MusicBrainz nomme l'artiste « Ye » : le crédit imprimé « Kanye West »
    // n'est pas repris, seul le MBID compte
    expect(credits).toContainEqual({
      recordingMbid: MBID.DARK_FANTASY,
      artistMbid: MBID.YE,
      roleCode: "producer",
      detail: null,
    })
    // relation de l'œuvre, rattachée au morceau
    expect(credits).toContainEqual({
      recordingMbid: MBID.DARK_FANTASY,
      artistMbid: MBID.YE,
      roleCode: "writer",
      detail: null,
    })
    expect(credits.filter((c) => c.roleCode === "writer")).toHaveLength(8)
  })

  it("donne plusieurs rôles au même artiste sur un morceau", () => {
    const recording = darkFantasy()
    const credits = toCredits(
      recording.id,
      creditRelations(recording, ROLE_CODES)
    )

    // c'est pour ce cas que le rôle fait partie de la clé primaire de credits
    const mikeDean = credits.filter((c) => c.artistMbid === MBID.MIKE_DEAN)
    expect(mikeDean.map((c) => [c.roleCode, c.detail])).toEqual([
      ["instrument", "cello, piano"],
      ["mix", null],
      ["producer", "additional"],
      ["recording", null],
      ["writer", null],
    ])
  })

  it("ignore les types de relation absents de la table roles", () => {
    const recording = darkFantasy()
    const withoutMix = new Set([...ROLE_CODES].filter((r) => r !== "mix"))

    const credits = toCredits(
      recording.id,
      creditRelations(recording, withoutMix)
    )

    expect(credits.map((c) => c.roleCode)).not.toContain("mix")
    // "performance" (morceau → œuvre) n'est jamais un crédit
    expect(credits.map((c) => c.roleCode)).not.toContain("performance")
  })

  it("fusionne les relations d'un même artiste pour un même rôle", () => {
    const recording: MbRecording = {
      id: MBID.DARK_FANTASY,
      title: "Test",
      length: null,
      relations: [
        artistRelation("instrument", "a", ["cello"]),
        artistRelation("instrument", "a", ["piano"]),
        artistRelation("instrument", "a", ["cello"]),
        artistRelation("producer", "a"),
      ],
    }

    const credits = toCredits(
      recording.id,
      creditRelations(recording, ROLE_CODES)
    )

    expect(credits).toEqual([
      {
        recordingMbid: recording.id,
        artistMbid: "a",
        roleCode: "instrument",
        detail: "cello, piano",
      },
      {
        recordingMbid: recording.id,
        artistMbid: "a",
        roleCode: "producer",
        detail: null,
      },
    ])
  })

  it("ajoute les relations de la release entière", () => {
    const recording = darkFantasy()
    const mastering = artistRelation("mastering", "mastering-engineer")

    const relations = creditRelations(recording, ROLE_CODES, [mastering])

    expect(relations).toContain(mastering)
  })
})
