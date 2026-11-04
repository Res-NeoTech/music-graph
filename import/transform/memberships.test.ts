import { describe, expect, it } from "vitest"

import type { MbArtist, MbRelation } from "@/import/musicbrainz/types"
import { MBID, yeArtist } from "@/tests/fixtures/musicbrainz"

import { membershipArtists, toMemberships } from "./memberships"

// Tests de toMemberships(), à faire passer : npx vitest run import/transform/memberships

function memberOf(
  direction: "forward" | "backward",
  other: { id: string; name: string },
  {
    begin = null as string | null,
    end = null as string | null,
    ended = true,
    attributes = [] as string[],
  } = {}
): MbRelation {
  return {
    type: "member of band",
    "target-type": "artist",
    direction,
    attributes,
    begin,
    end,
    ended,
    artist: { ...other, "sort-name": other.name },
  }
}

const byGroup = (rows: ReturnType<typeof toMemberships>, groupMbid: string) =>
  rows.find((row) => row.groupMbid === groupMbid)

const byMember = (rows: ReturnType<typeof toMemberships>, memberMbid: string) =>
  rows.find((row) => row.memberMbid === memberMbid)

describe("toMemberships — une personne (relations forward, vraies données)", () => {
  it("donne une ligne par groupe de Ye, avec Ye comme membre", () => {
    const rows = toMemberships(yeArtist())

    // KIDS SEE GHOSTS, ¥$, The Throne, Child Rebel Soldier…
    expect(rows).toHaveLength(9)
    expect(rows.every((row) => row.memberMbid === MBID.YE)).toBe(true)
  })

  it("KIDS SEE GHOSTS : groupe et membre inversés, « original » ignoré", () => {
    const row = byGroup(toMemberships(yeArtist()), MBID.KIDS_SEE_GHOSTS)

    expect(row).toEqual({
      groupMbid: MBID.KIDS_SEE_GHOSTS,
      memberMbid: MBID.YE,
      startDate: "2018",
      finishDate: "2022",
      detail: null, // seul attribut : "original"
    })
  })

  it("¥$ : période non terminée, la fin reste à null", () => {
    const row = byGroup(toMemberships(yeArtist()), MBID.YE_TY_DOLLA_SIGN)

    expect(row).toMatchObject({ startDate: "2023", finishDate: null })
  })

  it("Child Rebel Soldier : dates partielles et complètes", () => {
    const row = byGroup(toMemberships(yeArtist()), MBID.CHILD_REBEL_SOLDIER)

    expect(row).toMatchObject({ startDate: "2007", finishDate: "2013-07-25" })
  })

  it("ignore les autres types de relation", () => {
    const artist = yeArtist()
    const others = artist.relations!.filter((r) => r.type !== "member of band")
    expect(others).not.toHaveLength(0) // la fixture en contient bien une

    artist.relations = others
    expect(toMemberships(artist)).toEqual([])
  })

  it("renvoie un tableau vide sans relations", () => {
    const artist = yeArtist()
    delete artist.relations
    expect(toMemberships(artist)).toEqual([])
  })
})

// MusicBrainz n'a qu'une relation par membre pour KIDS SEE GHOSTS : les
// relations ci-dessous sont inventées pour tester la fusion (un groupe a une
// relation par instrument et par période, voir la doc de toMemberships).
describe("toMemberships — un groupe (relations backward)", () => {
  const ye = { id: MBID.YE, name: "Ye" }
  const kidCudi = { id: MBID.KID_CUDI, name: "Kid Cudi" }
  const kidsSeeGhosts = (relations: MbRelation[]): MbArtist => ({
    id: MBID.KIDS_SEE_GHOSTS,
    name: "KIDS SEE GHOSTS",
    "sort-name": "KIDS SEE GHOSTS",
    relations,
  })

  it("donne une ligne par membre, avec le groupe importé comme groupe", () => {
    const rows = toMemberships(
      kidsSeeGhosts([
        memberOf("backward", ye, { begin: "2018", end: "2022" }),
        memberOf("backward", kidCudi, { begin: "2018", end: "2022" }),
      ])
    )

    expect(rows).toHaveLength(2)
    expect(rows.every((row) => row.groupMbid === MBID.KIDS_SEE_GHOSTS)).toBe(
      true
    )
    expect(byMember(rows, MBID.KID_CUDI)).toEqual({
      groupMbid: MBID.KIDS_SEE_GHOSTS,
      memberMbid: MBID.KID_CUDI,
      startDate: "2018",
      finishDate: "2022",
      detail: null,
    })
  })

  it("fusionne les relations d'un membre (une par instrument et par période)", () => {
    const rows = toMemberships(
      kidsSeeGhosts([
        memberOf("backward", ye, {
          begin: "2018",
          end: "2018",
          attributes: ["original", "lead vocals"],
        }),
        memberOf("backward", ye, {
          begin: "2021",
          end: "2022",
          attributes: ["keyboard", "lead vocals"],
        }),
      ])
    )

    expect(rows).toEqual([
      {
        groupMbid: MBID.KIDS_SEE_GHOSTS,
        memberMbid: MBID.YE,
        startDate: "2018", // la plus ancienne
        finishDate: "2022", // la plus récente
        // sans "original", sans doublon, dans l'ordre d'apparition
        detail: "lead vocals, keyboard",
      },
    ])
  })

  it("laisse la fin à null si une des périodes n'est pas terminée", () => {
    const rows = toMemberships(
      kidsSeeGhosts([
        memberOf("backward", kidCudi, {
          begin: "2018",
          end: "2019",
          attributes: ["guitar"],
        }),
        memberOf("backward", kidCudi, {
          begin: "2018",
          ended: false,
          attributes: ["lead vocals", "original"],
        }),
      ])
    )

    expect(rows).toEqual([
      {
        groupMbid: MBID.KIDS_SEE_GHOSTS,
        memberMbid: MBID.KID_CUDI,
        startDate: "2018",
        finishDate: null,
        detail: "guitar, lead vocals",
      },
    ])
  })

  it("met les dates à null si MusicBrainz n'en donne pas", () => {
    const rows = toMemberships(
      kidsSeeGhosts([memberOf("backward", ye, { attributes: ["original"] })])
    )
    expect(rows[0]).toMatchObject({
      startDate: null,
      finishDate: null,
      detail: null,
    })
  })
})

describe("membershipArtists", () => {
  it("liste les groupes de Ye une seule fois chacun", () => {
    const artists = membershipArtists(yeArtist())

    expect(artists).toHaveLength(9)
    expect(artists.map((a) => a.mbid)).toContain(MBID.KIDS_SEE_GHOSTS)
  })
})
