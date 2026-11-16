import { describe, expect, it } from "vitest"

import type { MbArtist, MbRelation } from "@/import/musicbrainz/types"
import { yeArtist } from "@/tests/fixtures/musicbrainz"
import {
  seanCombsFileInfo,
  YE_IMAGE_FILE,
  YE_WIKIDATA_ID,
  yeFileInfo,
  yeImageClaims,
} from "@/tests/fixtures/wikimedia"

import {
  htmlToText,
  NO_ARTIST_IMAGE,
  pickImageFile,
  toArtistImage,
  wikidataId,
} from "./image"

function wikidataLink(qid: string, ended = false): MbRelation {
  return {
    type: "wikidata",
    "target-type": "url",
    direction: "forward",
    attributes: [],
    ended,
    url: { id: "x", resource: `https://www.wikidata.org/wiki/${qid}` },
  }
}

const artistWith = (relations: MbRelation[]): MbArtist => ({
  ...yeArtist(),
  relations,
})

describe("wikidataId", () => {
  it("lit le lien Wikidata d'un artiste (vraies données)", () => {
    expect(wikidataId(yeArtist())).toBe(YE_WIKIDATA_ID)
  })

  it("renvoie null sans lien Wikidata", () => {
    const artist = yeArtist()
    artist.relations = artist.relations!.filter((r) => r.type !== "wikidata")
    expect(wikidataId(artist)).toBeNull()
    delete artist.relations
    expect(wikidataId(artist)).toBeNull()
  })

  it("préfère un lien en cours à un lien terminé", () => {
    const artist = artistWith([wikidataLink("Q1", true), wikidataLink("Q2")])
    expect(wikidataId(artist)).toBe("Q2")
  })

  it("ignore une URL qui n'est pas celle d'un élément", () => {
    const relation = wikidataLink("Q1")
    relation.url!.resource = "https://www.wikidata.org/wiki/Property:P18"
    expect(wikidataId(artistWith([relation]))).toBeNull()
  })
})

describe("pickImageFile", () => {
  it("prend la valeur de rang « preferred » (vraies données)", () => {
    expect(pickImageFile(yeImageClaims())).toBe(YE_IMAGE_FILE)
  })

  it("sinon la première de rang « normal »", () => {
    const claims = yeImageClaims()
    claims.claims!.P18![0].rank = "normal"
    claims.claims!.P18!.reverse()
    expect(pickImageFile(claims)).toBe(
      "Kanye West at the Met Gala in 2019 2.png"
    )
  })

  it("ignore les valeurs « deprecated » et « novalue »", () => {
    const claims = yeImageClaims()
    const [preferred, normal] = claims.claims!.P18!
    preferred.rank = "deprecated"
    normal.mainsnak = { snaktype: "novalue" }
    expect(pickImageFile(claims)).toBeNull()
  })

  it("renvoie null si l'élément n'a pas d'image", () => {
    expect(pickImageFile({ claims: {} })).toBeNull()
    expect(pickImageFile({})).toBeNull()
  })
})

describe("toArtistImage", () => {
  it("garde le fichier, l'auteur sans HTML et la licence (vraies données)", () => {
    expect(toArtistImage(YE_IMAGE_FILE, yeFileInfo())).toEqual({
      imageFile: YE_IMAGE_FILE,
      imageAuthor: "David Shankbone",
      imageLicence: "Public domain",
    })
  })

  it("lit une licence Creative Commons", () => {
    const image = toArtistImage("Sean Combs.jpg", seanCombsFileInfo())
    expect(image.imageAuthor).toBe("Nikeush")
    expect(image.imageLicence).toBe("CC BY-SA 4.0")
  })

  it("pas de photo si le fichier n'existe plus sur Commons", () => {
    const missing = {
      query: { pages: [{ title: "File:X.jpg", missing: true }] },
    }
    expect(toArtistImage("X.jpg", missing)).toEqual(NO_ARTIST_IMAGE)
  })

  it("garde la photo même sans auteur ni licence", () => {
    const bare = {
      query: { pages: [{ title: "File:X.jpg", imageinfo: [{}] }] },
    }
    expect(toArtistImage("X.jpg", bare)).toEqual({
      imageFile: "X.jpg",
      imageAuthor: null,
      imageLicence: null,
    })
  })
})

describe("htmlToText", () => {
  it("retire les balises, décode les entités et les espaces en trop", () => {
    expect(
      htmlToText(
        "<p>United Press International<br>\n</p>\nCropping: User:A &amp; User:B&#39;s"
      )
    ).toBe("United Press International Cropping: User:A & User:B's")
  })

  it("renvoie null pour un texte vide", () => {
    expect(htmlToText("<span> </span>")).toBeNull()
    expect(htmlToText(undefined)).toBeNull()
  })
})
