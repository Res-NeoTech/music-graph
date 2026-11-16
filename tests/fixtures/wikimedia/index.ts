import type {
  CommonsImageInfoResponse,
  WdClaimsResponse,
} from "@/import/wikimedia/types"

import seanCombsInfo from "./commons-sean-combs.json"
import yeInfo from "./commons-ye.json"
import yeClaims from "./wikidata-p18-ye.json"

// Vraies réponses des API Wikidata et Commons (novembre 2026), réduites aux
// champs lus par l'import (qualificatifs et références de Wikidata retirés).

/**
 * wbgetclaims, Ye (Q15935), propriété P18 : deux photos, la première de rang
 * « preferred ».
 */
export const yeImageClaims = () => structuredClone(yeClaims) as WdClaimsResponse

/** imageinfo de la photo préférée de Ye : domaine public, auteur en HTML. */
export const yeFileInfo = () =>
  structuredClone(yeInfo) as CommonsImageInfoResponse

/** imageinfo d'une photo sous CC BY-SA 4.0 (Sean Combs, Q216936). */
export const seanCombsFileInfo = () =>
  structuredClone(seanCombsInfo) as CommonsImageInfoResponse

export const YE_WIKIDATA_ID = "Q15935"
export const YE_IMAGE_FILE =
  "Kanye West at the 2009 Tribeca Film Festival (crop 2).jpg"
