import { describe, expect, it } from "vitest"

import {
  countryName,
  formatActiveYears,
  formatDuration,
  formatPartialDate,
  lifeSpanLabels,
  totalDuration,
} from "./format"

describe("formatPartialDate", () => {
  it("n'affiche que la précision connue", () => {
    expect(formatPartialDate("1991")).toBe("1991")
    expect(formatPartialDate("1991-09")).toBe("September 1991")
    expect(formatPartialDate("1991-09-24")).toBe("September 24, 1991")
  })

  it("ne décale pas le jour selon le fuseau horaire", () => {
    expect(formatPartialDate("2022-11-01")).toBe("November 1, 2022")
    expect(formatPartialDate("1998-12-31")).toBe("December 31, 1998")
  })

  it("renvoie null sans date", () => {
    expect(formatPartialDate(null)).toBeNull()
    expect(formatPartialDate("")).toBeNull()
  })
})

describe("formatActiveYears", () => {
  it("affiche la période quand la fin est connue", () => {
    expect(formatActiveYears("person", "1994-06-18", "2022-11-01")).toBe(
      "1994 – 2022"
    )
    expect(formatActiveYears("group", "2008", "2023-06-25")).toBe("2008 – 2023")
  })

  it("adapte le texte au type quand l'artiste est encore actif", () => {
    expect(formatActiveYears("person", "1987-06-17", null)).toBe("Born 1987")
    expect(formatActiveYears("group", "2017", null)).toBe("Since 2017")
    expect(formatActiveYears(null, "2017", null)).toBe("Since 2017")
  })

  it("renvoie null sans date de début", () => {
    expect(formatActiveYears("person", null, null)).toBeNull()
    expect(formatActiveYears("group", null, "2020")).toBeNull()
  })
})

describe("lifeSpanLabels", () => {
  it("dépend du type d'artiste", () => {
    expect(lifeSpanLabels("person")).toEqual({ start: "Born", finish: "Died" })
    expect(lifeSpanLabels("choir")).toEqual({
      start: "Founded",
      finish: "Dissolved",
    })
    expect(lifeSpanLabels(null)).toEqual({ start: "Started", finish: "Ended" })
  })
})

describe("countryName", () => {
  it("traduit un code ISO", () => {
    expect(countryName("US")).toBe("United States")
    expect(countryName("ch")).toBe("Switzerland")
  })

  it("gère les codes propres à MusicBrainz", () => {
    expect(countryName("XW")).toBe("Worldwide")
  })

  it("renvoie null sans code et le code tel quel s'il est invalide", () => {
    expect(countryName(null)).toBeNull()
    expect(countryName("?")).toBe("?")
  })
})

describe("formatDuration", () => {
  it("minutes:secondes, heures au-delà d'une heure", () => {
    expect(formatDuration(280786)).toBe("4:41") // Dark Fantasy
    expect(formatDuration(5000)).toBe("0:05")
    expect(formatDuration(3723000)).toBe("1:02:03")
  })

  it("null si inconnue", () => {
    expect(formatDuration(null)).toBeNull()
    expect(formatDuration(0)).toBeNull()
  })
})

describe("totalDuration", () => {
  it("additionne les durées", () => {
    expect(totalDuration([1000, 2500])).toBe(3500)
  })

  it("null si une durée manque ou s'il n'y a pas de piste", () => {
    expect(totalDuration([1000, null])).toBeNull()
    expect(totalDuration([])).toBeNull()
  })
})
