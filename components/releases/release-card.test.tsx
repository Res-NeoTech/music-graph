import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import type { Release } from "@/lib/types"

import { ReleaseCard } from "./release-card"

const MBDTF: Release = {
  mbid: "cd474271-bd7a-4d53-ba9e-e9d5bd7958cb",
  releaseGroupMbid: "5d6e21e1-deb5-428e-bb42-c2a567f3619b",
  title: "My Beautiful Dark Twisted Fantasy",
  type: "album",
  releaseDate: "2010-11-22",
  hasCoverArt: true,
}

afterEach(cleanup)

describe("ReleaseCard", () => {
  it("affiche titre, type et date, et pointe vers la page de la release", () => {
    render(<ReleaseCard release={MBDTF} />)

    expect(screen.getByRole("heading", { name: MBDTF.title })).toBeDefined()
    expect(screen.getByText("Album")).toBeDefined()
    expect(screen.getByText("November 22, 2010")).toBeDefined()
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      `/releases/${MBDTF.mbid}`
    )
  })

  it("charge la pochette depuis la Cover Art Archive", () => {
    const { container } = render(<ReleaseCard release={MBDTF} />)

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      `https://coverartarchive.org/release/${MBDTF.mbid}/front-500`
    )
  })

  it("affiche l'icône sans pochette, ou si elle ne se charge pas", () => {
    const { container, rerender } = render(
      <ReleaseCard release={{ ...MBDTF, hasCoverArt: false }} />
    )
    expect(container.querySelector("img")).toBeNull()

    rerender(<ReleaseCard key="with-cover" release={MBDTF} />)
    fireEvent.error(container.querySelector("img")!)
    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector("svg")).not.toBeNull()
  })

  it("n'affiche que la précision connue de la date", () => {
    render(<ReleaseCard release={{ ...MBDTF, releaseDate: "2010" }} />)
    expect(screen.getByText("2010")).toBeDefined()
  })
})
