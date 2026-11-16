import { cleanup, fireEvent, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { ArtistAvatar } from "./artist-avatar"

const IMAGE = { file: "Ye (crop).jpg", author: "A", licence: "Public domain" }

afterEach(cleanup)

describe("ArtistAvatar", () => {
  it("affiche la vignette Commons quand l'artiste a une photo", () => {
    const { container } = render(<ArtistAvatar type="person" image={IMAGE} />)

    const img = container.querySelector("img")
    expect(img?.getAttribute("src")).toBe(
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ye_(crop).jpg?width=250"
    )
    expect(img?.getAttribute("alt")).toBe("")
  })

  it("affiche l'icône du type sans photo", () => {
    const { container } = render(<ArtistAvatar type="group" image={null} />)

    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector("svg")).not.toBeNull()
  })

  it("revient à l'icône si la photo ne se charge pas", () => {
    const { container } = render(<ArtistAvatar type="person" image={IMAGE} />)

    fireEvent.error(container.querySelector("img")!)

    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector("svg")).not.toBeNull()
  })
})
