import { describe, expect, it } from "vitest"

import type {
  MbBrowseRelease,
  MbReleaseGroup,
} from "@/import/musicbrainz/types"
import { yeReleases } from "@/tests/fixtures/musicbrainz"

import { pickReleases } from "./releases"

// Tests de pickReleases(), à faire passer : npx vitest run import/transform/releases

const ALBUM: MbReleaseGroup = {
  id: "rg-album",
  title: "Album",
  "primary-type": "Album",
  "secondary-types": [],
  "first-release-date": "1991-09-24",
}

function release(
  id: string,
  {
    date = "",
    front = false,
    status = "Official",
    group = ALBUM,
  }: {
    date?: string
    front?: boolean
    status?: string | null
    group?: MbReleaseGroup
  } = {}
): MbBrowseRelease {
  return {
    id,
    title: group.title,
    status,
    date,
    "cover-art-archive": { front },
    "release-group": group,
  }
}

const ids = (releases: MbBrowseRelease[]) => releases.map((r) => r.id).sort()

describe("pickReleases — filtre", () => {
  it("garde une seule release par release group", () => {
    const ep: MbReleaseGroup = { ...ALBUM, id: "rg-ep", "primary-type": "EP" }

    const picked = pickReleases([
      release("a1", { date: "1991-09-24" }),
      release("a2", { date: "1992" }),
      release("e1", { group: ep }),
    ])

    expect(picked).toHaveLength(2)
    expect(picked.map((r) => r["release-group"].id).sort()).toEqual([
      "rg-album",
      "rg-ep",
    ])
  })

  it("exclut les releases non officielles", () => {
    expect(pickReleases([release("bootleg", { status: "Bootleg" })])).toEqual(
      []
    )
    expect(pickReleases([release("unknown", { status: null })])).toEqual([])
  })

  it("exclut les singles et les types inconnus", () => {
    const single: MbReleaseGroup = { ...ALBUM, "primary-type": "Single" }
    const none: MbReleaseGroup = { ...ALBUM, "primary-type": null }

    expect(pickReleases([release("s", { group: single })])).toEqual([])
    expect(pickReleases([release("n", { group: none })])).toEqual([])
  })

  it("exclut les compilations et les live (types secondaires)", () => {
    const compilation: MbReleaseGroup = {
      ...ALBUM,
      "secondary-types": ["Compilation"],
    }
    const live: MbReleaseGroup = { ...ALBUM, "secondary-types": ["Live"] }

    expect(pickReleases([release("c", { group: compilation })])).toEqual([])
    expect(pickReleases([release("l", { group: live })])).toEqual([])
  })
})

describe("pickReleases — choix de l'édition", () => {
  it("a. préfère l'édition originale, même si une autre a une date plus ancienne", () => {
    const picked = pickReleases([
      release("partial", { date: "1991", front: true }), // "1991" < "1991-09-24"
      release("original", { date: "1991-09-24" }),
    ])
    expect(ids(picked)).toEqual(["original"])
  })

  it("a. une date vide n'est pas une date d'origine", () => {
    const unknownGroup: MbReleaseGroup = { ...ALBUM, "first-release-date": "" }

    const picked = pickReleases([
      release("no-date", { group: unknownGroup }),
      release("with-cover", { group: unknownGroup, front: true }),
    ])
    expect(ids(picked)).toEqual(["with-cover"])
  })

  it("b. à égalité, préfère une édition avec pochette", () => {
    const picked = pickReleases([
      release("no-cover", { date: "1991-09-24", front: false }),
      release("cover", { date: "1991-09-24", front: true }),
    ])
    expect(ids(picked)).toEqual(["cover"])
  })

  it("c. puis la date la plus ancienne, les releases sans date en dernier", () => {
    const picked = pickReleases([
      release("no-date", { front: true }),
      release("1996", { date: "1996-03-12", front: true }),
      release("1992", { date: "1992", front: true }),
    ])
    expect(ids(picked)).toEqual(["1992"])
  })

  it("d. puis le plus petit MBID, quel que soit l'ordre d'entrée", () => {
    const b = release("bbbb", { date: "1991-09-24", front: true })
    const a = release("aaaa", { date: "1991-09-24", front: true })
    const c = release("cccc", { date: "1991-09-24", front: true })

    expect(ids(pickReleases([b, a, c]))).toEqual(["aaaa"])
    expect(ids(pickReleases([c, b, a]))).toEqual(["aaaa"])
  })

  it("choisit une édition par album de Ye (vraies données)", () => {
    const { releases } = yeReleases()

    expect(ids(pickReleases(releases))).toEqual(
      [
        // 17 éditions, une seule au 2010-11-19 : la règle a la choisit, alors
        // que les éditions datées « 2010 » et « 2010-11 » passeraient avant
        // avec la seule règle c
        "cd474271-bd7a-4d53-ba9e-e9d5bd7958cb", // My Beautiful Dark Twisted Fantasy, 2010-11-19
        // l'édition originale n'a pas de pochette : la règle a passe avant la b
        "11b6532c-0de0-45bb-84fc-7e99514a4cd5", // The College Dropout, 2004-02-09
        // aucune édition datée « 2005-03 » (first-release-date) : règles b et c
        "789b10b1-944b-4b73-8a9e-b318119124b1", // Late Registration, 2005
        // aucune des 2 éditions n'est datée du 2016-02-14 (first-release-date)
        "f84ac70c-0956-4752-950c-0a1cdc4ee5a0", // The Life of Pablo, 2016-04-05
        "1dc62127-0ff6-4364-8275-8998d442d673", // Glow in the Dark (EP), 2009-10-20
      ].sort()
    )
    // exclus par leur type secondaire : Late Orchestration (live),
    // Love Lockdown (compilation), Donda 2 (démo)
  })
})
