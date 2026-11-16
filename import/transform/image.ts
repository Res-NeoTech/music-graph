import type { MbArtist } from "../musicbrainz/types"
import type {
  CommonsImageInfoResponse,
  WdClaimsResponse,
  WdStatement,
} from "../wikimedia/types"

import { emptyToNull } from "./fields"
import type { ArtistImageRow } from "./types"

// Photo d'un artiste, en trois étapes, chacune une fonction pure :
//   MusicBrainz (lien Wikidata) → Wikidata (P18 = nom du fichier)
//   → Commons (auteur et licence, à afficher avec la photo).
// Le MBID mène au Q-id par un lien saisi sur MusicBrainz : jamais de
// recherche par nom, donc pas de photo d'un homonyme.

export const NO_ARTIST_IMAGE: ArtistImageRow = {
  imageFile: null,
  imageAuthor: null,
  imageLicence: null,
}

const WIKIDATA_URL =
  /^https?:\/\/(?:www\.)?wikidata\.org\/wiki\/(Q[1-9][0-9]*)$/

/**
 * Identifiant Wikidata de l'artiste ("Q15935"), lu dans ses liens externes
 * (lookup avec inc=url-rels). Un lien marqué terminé (ended) n'est pris que
 * s'il n'y en a pas d'autre.
 */
export function wikidataId(artist: MbArtist): string | null {
  const ids = (artist.relations ?? [])
    .filter((r) => r.type === "wikidata" && r["target-type"] === "url")
    .sort((a, b) => Number(a.ended ?? false) - Number(b.ended ?? false))
    .map((r) => WIKIDATA_URL.exec(r.url?.resource ?? "")?.[1])
  return ids.find((id) => id !== undefined) ?? null
}

/**
 * Nom du fichier Commons à utiliser parmi les valeurs de P18 : celle de rang
 * « preferred » s'il y en a une, sinon la première de rang « normal ».
 * Les valeurs « deprecated » (jugées fausses) sont ignorées.
 */
export function pickImageFile(response: WdClaimsResponse): string | null {
  const usable = (response.claims?.P18 ?? []).filter(
    (s) => s.rank !== "deprecated" && fileName(s) !== null
  )
  const best = usable.find((s) => s.rank === "preferred") ?? usable[0]
  return best ? fileName(best) : null
}

function fileName(statement: WdStatement): string | null {
  const { snaktype, datavalue } = statement.mainsnak
  return snaktype === "value" && typeof datavalue?.value === "string"
    ? emptyToNull(datavalue.value.trim())
    : null
}

/**
 * Ligne « photo » de l'artiste : le fichier, son auteur et sa licence.
 * Si le fichier n'existe plus sur Commons (supprimé, renommé), pas de photo
 * plutôt qu'une image cassée.
 */
export function toArtistImage(
  file: string,
  info: CommonsImageInfoResponse
): ArtistImageRow {
  const page = info.query?.pages[0]
  if (!page || page.missing) return NO_ARTIST_IMAGE

  const metadata = page.imageinfo?.[0]?.extmetadata
  return {
    imageFile: file,
    imageAuthor: htmlToText(metadata?.Artist?.value),
    imageLicence: htmlToText(metadata?.LicenseShortName?.value),
  }
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

/**
 * Commons donne l'auteur en HTML (« <bdi><a href=…>David Shankbone</a></bdi> »).
 * On garde le texte seul : la page l'affiche comme du texte, jamais comme du
 * HTML (pas de risque d'injection de script).
 */
export function htmlToText(html: string | null | undefined): string | null {
  if (!html) return null
  const text = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? entity
      const point =
        code[1].toLowerCase() === "x"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10)
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ""
    })
    .replace(/\s+/g, " ")
    .trim()
  return emptyToNull(text)
}
