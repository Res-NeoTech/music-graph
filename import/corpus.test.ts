import { describe, expect, it } from "vitest"

import { isMbid } from "@/lib/mbid"

import { selectArtistsToImport } from "./corpus"
import { CORPUS } from "./corpus.generated" // this file is in .gitignore, so generate it using `npm run populate`
import type { ImportStatus } from "./transform/types"

// Tests de selectArtistsToImport(), à faire passer : npx vitest run import/corpus

const statuses = new Map<string, ImportStatus | null>([
  ["ok", "ok"],
  ["failed", "failed"],
  ["pending", "pending"],
  ["stub", null], // ligne créée comme crédit d'un autre artiste
  // "missing" : pas de ligne dans la table
])

describe("selectArtistsToImport", () => {
  it("mode all : tout le corpus, dans l'ordre", () => {
    const corpus = ["pending", "ok", "missing", "failed"]
    expect(selectArtistsToImport(corpus, statuses, "all")).toEqual(corpus)
  })

  it("mode failed : tout ce qui n'est pas « ok »", () => {
    const corpus = ["ok", "failed", "pending", "stub", "missing"]
    expect(selectArtistsToImport(corpus, statuses, "failed")).toEqual([
      "failed",
      "pending",
      "stub",
      "missing",
    ])
  })

  it("mode failed : rien à faire si tout est importé", () => {
    expect(selectArtistsToImport(["ok"], statuses, "failed")).toEqual([])
  })

  it.each(["all", "failed"] as const)(
    "mode %s : un doublon n'est importé qu'une fois",
    (mode) => {
      const corpus = ["missing", "failed", "missing"]
      expect(selectArtistsToImport(corpus, statuses, mode)).toEqual([
        "missing",
        "failed",
      ])
    }
  )
})

describe("CORPUS", () => {
  it("ne contient que des MBID valides, sans doublon", () => {
    const mbids = CORPUS.map((artist) => artist.mbid)
    expect(mbids.filter((mbid) => !isMbid(mbid))).toEqual([])
    expect(new Set(mbids).size).toBe(mbids.length)
  })
})
