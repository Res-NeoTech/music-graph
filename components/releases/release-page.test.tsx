import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import type { ArtistCredit, Release, Track } from "@/lib/types"

import { ReleaseFacts } from "./release-facts"
import { ReleaseHeader } from "./release-header"
import { groupByDisc, Tracklist } from "./tracklist"

// Données réelles (tests/fixtures/musicbrainz/release-mbdtf.json), sous la
// forme que renverra le DAL : édition CD + DVD, 3 pistes puis le film.
const MBDTF: Release = {
  mbid: "cd474271-bd7a-4d53-ba9e-e9d5bd7958cb",
  releaseGroupMbid: "5d6e21e1-deb5-428e-bb42-c2a567f3619b",
  title: "My Beautiful Dark Twisted Fantasy",
  type: "album",
  releaseDate: "2010-11-22",
  hasCoverArt: true,
}

const track = (
  discNumber: number,
  position: number,
  title: string,
  durationMs: number | null
): Track => ({
  mbid: `${discNumber}-${position}`,
  recordingMbid: `recording-${title}`,
  discNumber,
  position,
  title,
  durationMs,
})

// volontairement dans le désordre : le composant doit trier
const TRACKS: Track[] = [
  track(2, 1, "Runaway", 2067000),
  track(1, 2, "Gorgeous", 357653),
  track(1, 1, "Dark Fantasy", 280786),
  track(1, 3, "Power", 292093),
]

afterEach(cleanup)

describe("ReleaseHeader", () => {
  it("affiche titre, crédit d'artiste lié par MBID, type et date", () => {
    const artists: ArtistCredit[] = [
      {
        artistMbid: "164f0d73-1234-4e2c-8743-d77bf2191051",
        creditedName: "Kanye West",
        joinPhrase: " feat. ",
      },
      { artistMbid: "kid-cudi", creditedName: "Kid Cudi", joinPhrase: "" },
    ]
    render(<ReleaseHeader release={MBDTF} artists={artists} />)

    expect(
      screen.getByRole("heading", { level: 1, name: MBDTF.title })
    ).toBeDefined()
    expect(screen.getByText("Album")).toBeDefined()
    expect(screen.getByText("November 22, 2010")).toBeDefined()
    expect(
      screen.getByRole("link", { name: "Kanye West" }).getAttribute("href")
    ).toBe("/artists/164f0d73-1234-4e2c-8743-d77bf2191051")
    // le texte de liaison est conservé tel quel
    expect(screen.getByText(/feat\./).textContent).toBe(
      "Kanye West feat. Kid Cudi"
    )
  })

  it("fonctionne sans crédit ni pochette", () => {
    const { container } = render(
      <ReleaseHeader release={{ ...MBDTF, hasCoverArt: false }} />
    )
    expect(container.querySelector("img")).toBeNull()
    expect(screen.queryByRole("link")).toBeNull()
  })
})

describe("ReleaseFacts", () => {
  it("résume les pistes : nombre, durée totale, disques", () => {
    render(<ReleaseFacts release={MBDTF} tracks={TRACKS} />)

    const value = (label: string) =>
      screen.getByText(label).nextElementSibling?.textContent
    expect(value("Tracks")).toBe("4")
    expect(value("Length")).toBe("49:58")
    expect(value("Discs")).toBe("2")
    expect(value("Released")).toBe("November 22, 2010")
  })

  it("n'affiche que ce qui est connu", () => {
    render(
      <ReleaseFacts
        release={{ ...MBDTF, releaseDate: null }}
        tracks={[track(1, 1, "A", 1000), track(1, 2, "B", null)]}
      />
    )
    expect(screen.queryByText("Released")).toBeNull()
    expect(screen.queryByText("Length")).toBeNull() // une durée manque
    expect(screen.queryByText("Discs")).toBeNull() // un seul disque
    expect(screen.getByText(MBDTF.mbid)).toBeDefined()
  })
})

describe("Tracklist", () => {
  it("trie par disque puis par position", () => {
    expect(
      groupByDisc(TRACKS).map(([disc, list]) => [
        disc,
        list.map((t) => t.title),
      ])
    ).toEqual([
      [1, ["Dark Fantasy", "Gorgeous", "Power"]],
      [2, ["Runaway"]],
    ])
  })

  it("affiche chaque disque, les durées et le lien vers le morceau", () => {
    render(<Tracklist tracks={TRACKS} />)

    const disc1 = screen.getByRole("region", { name: "Disc 1" })
    const rows = within(disc1).getAllByRole("listitem")
    expect(rows.map((row) => row.textContent)).toEqual([
      "1Dark Fantasy4:41",
      "2Gorgeous5:58",
      "3Power4:52",
    ])
    expect(
      within(disc1).getByRole("link", { name: "Gorgeous" }).getAttribute("href")
    ).toBe("/recordings/recording-Gorgeous")
    expect(screen.getByText("Disc 2")).toBeDefined()
  })

  it("pas d'intitulé de disque pour un seul disque, tiret si durée inconnue", () => {
    render(<Tracklist tracks={[track(1, 1, "Intro", null)]} />)

    expect(screen.queryByText("Disc 1")).toBeNull()
    expect(screen.getByRole("listitem").textContent).toBe("1Intro–")
  })

  it("indique une release sans pistes", () => {
    render(<Tracklist tracks={[]} />)
    expect(screen.getByText(/No tracks/)).toBeDefined()
  })
})
