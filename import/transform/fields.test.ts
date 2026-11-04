import { describe, expect, it } from "vitest"

import {
  emptyToNull,
  toArtistType,
  toDuration,
  toPartialDate,
  toReleaseType,
} from "./fields"

describe("toPartialDate", () => {
  it.each(["1991", "1991-09", "1991-09-24"])("garde %s", (date) => {
    expect(toPartialDate(date)).toBe(date)
  })

  it.each([
    undefined,
    null,
    "",
    "91",
    "1991-9",
    "1991/09/24",
    "1991-09-24T10:00",
  ])("rejette %s", (date) => {
    expect(toPartialDate(date)).toBeNull()
  })
})

describe("toArtistType", () => {
  it("passe en minuscules les types connus de l'enum", () => {
    expect(toArtistType("Group")).toBe("group")
    expect(toArtistType("Person")).toBe("person")
  })

  it("renvoie null pour un type absent ou inconnu", () => {
    expect(toArtistType(null)).toBeNull()
    expect(toArtistType("Band")).toBeNull()
  })
})

describe("toReleaseType", () => {
  it("convertit les types de release group", () => {
    expect(toReleaseType("Album")).toBe("album")
    expect(toReleaseType("EP")).toBe("ep")
    expect(toReleaseType(null)).toBeNull()
  })
})

describe("toDuration", () => {
  it("garde une durée positive, refuse 0 et null", () => {
    expect(toDuration(301_240)).toBe(301_240)
    expect(toDuration(0)).toBeNull()
    expect(toDuration(null)).toBeNull()
  })
})

describe("emptyToNull", () => {
  it("remplace la chaîne vide de MusicBrainz par null", () => {
    expect(emptyToNull("")).toBeNull()
    expect(emptyToNull(undefined)).toBeNull()
    expect(emptyToNull("live")).toBe("live")
  })
})
