import { describe, expect, it } from "vitest"

import { pageCount, pageWindow, parsePage } from "./pagination"

describe("parsePage", () => {
  it("lit un entier positif", () => {
    expect(parsePage("1")).toBe(1)
    expect(parsePage("42")).toBe(42)
  })

  it("renvoie 1 sans paramètre", () => {
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage("")).toBe(1)
  })

  it("renvoie 1 pour une valeur invalide", () => {
    expect(parsePage("abc")).toBe(1)
    expect(parsePage("0")).toBe(1)
    expect(parsePage("-3")).toBe(1)
    expect(parsePage("2.5")).toBe(1)
    expect(parsePage("3abc")).toBe(1)
    expect(parsePage("1e3")).toBe(1)
  })

  it("renvoie 1 pour un nombre trop grand", () => {
    expect(parsePage("99999999999999999999")).toBe(1)
  })

  it("prend la première valeur si le paramètre est répété", () => {
    expect(parsePage(["2", "5"])).toBe(2)
    expect(parsePage([])).toBe(1)
  })
})

describe("pageCount", () => {
  it("arrondit vers le haut", () => {
    expect(pageCount(6170, 24)).toBe(258)
    expect(pageCount(24, 24)).toBe(1)
    expect(pageCount(25, 24)).toBe(2)
  })

  it("vaut 0 sans élément", () => {
    expect(pageCount(0, 24)).toBe(0)
  })
})

describe("pageWindow", () => {
  it("affiche toutes les pages s'il y en a 7 ou moins", () => {
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("coupe après les premières pages au début", () => {
    expect(pageWindow(1, 258)).toEqual([1, 2, 3, 4, 5, "ellipsis", 258])
    expect(pageWindow(4, 258)).toEqual([1, 2, 3, 4, 5, "ellipsis", 258])
  })

  it("coupe des deux côtés au milieu", () => {
    expect(pageWindow(5, 258)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      258,
    ])
  })

  it("coupe avant les dernières pages à la fin", () => {
    expect(pageWindow(255, 258)).toEqual([
      1,
      "ellipsis",
      254,
      255,
      256,
      257,
      258,
    ])
    expect(pageWindow(258, 258)).toEqual([
      1,
      "ellipsis",
      254,
      255,
      256,
      257,
      258,
    ])
  })

  it("contient toujours la page courante et garde 7 éléments", () => {
    for (let current = 1; current <= 30; current++) {
      const items = pageWindow(current, 30)
      expect(items).toContain(current)
      expect(items).toHaveLength(7)
    }
  })
})
