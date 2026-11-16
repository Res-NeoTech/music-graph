import { describe, expect, it } from "vitest"

import { commonsFilePageUrl, commonsThumbnailUrl } from "./artist-image"

const FILE = "Kanye West at the 2009 Tribeca Film Festival (crop 2).jpg"

describe("URL Wikimedia Commons", () => {
  it("vignette : espaces → _, largeur par défaut 250 px", () => {
    expect(commonsThumbnailUrl(FILE)).toBe(
      "https://commons.wikimedia.org/wiki/Special:FilePath/" +
        "Kanye_West_at_the_2009_Tribeca_Film_Festival_(crop_2).jpg?width=250"
    )
  })

  it("encode les caractères réservés d'une URL", () => {
    expect(commonsThumbnailUrl("AC/DC & co?.jpg", 120)).toBe(
      "https://commons.wikimedia.org/wiki/Special:FilePath/AC%2FDC_%26_co%3F.jpg?width=120"
    )
    expect(commonsFilePageUrl("Beyoncé.jpg")).toBe(
      "https://commons.wikimedia.org/wiki/File:Beyonc%C3%A9.jpg"
    )
  })
})
