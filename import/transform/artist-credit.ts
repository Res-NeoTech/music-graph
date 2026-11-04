import type { MbArtistCredit } from "../musicbrainz/types"

import type { ArtistCreditRow } from "./types"

/**
 * Crédit d'artiste MusicBrainz → lignes `release_artists` / `recording_artists`
 * (sans la clé de la release ou du morceau, ajoutée par l'appelant).
 *
 * « Kanye West feat. Jay-Z » →
 *   { artistMbid: <Kanye>, position: 1, creditedName: "Kanye West", joinPhrase: " feat. " }
 *   { artistMbid: <Jay-Z>, position: 2, creditedName: "Jay-Z",      joinPhrase: "" }
 *
 * Un artiste cité deux fois n'est gardé qu'à sa première position :
 * (release, artiste) est la clé primaire de la table.
 */
export function toArtistCreditRows(
  credit: readonly MbArtistCredit[]
): ArtistCreditRow[] {
  const rows: ArtistCreditRow[] = []
  const seen = new Set<string>()
  credit.forEach((entry, index) => {
    if (seen.has(entry.artist.id)) return
    seen.add(entry.artist.id)
    rows.push({
      artistMbid: entry.artist.id,
      position: index + 1,
      creditedName: entry.name,
      joinPhrase: entry.joinphrase ?? "",
    })
  })
  return rows
}

export interface CreditRole {
  artistMbid: string
  role: "main" | "featuring"
}

/**
 * TODO (Maksym) — à implémenter. Tests : import/transform/artist-credit.test.ts
 *
 * Rôle de chaque artiste d'un crédit, pour les arêtes `credited` d'ArangoDB.
 * Le featuring n'est pas une relation MusicBrainz : il se lit dans les join
 * phrases du crédit (docs/postgres/mld.md, « Deux sortes de crédits »).
 *
 * Règles :
 * - Trier les lignes par `position` : ne pas supposer que le tableau est trié.
 * - Le premier artiste est toujours "main".
 * - Dès qu'une join phrase contient « feat », « ft » ou « featuring »
 *   (majuscules ignorées), tous les artistes qui suivent sont "featuring".
 * - Sinon "main" : « A & B », « A x B », « A with B » → deux artistes principaux.
 * - Le résultat est dans l'ordre des positions.
 *
 * Exemples :
 *   « A feat. B »     → A main, B featuring
 *   « A & B feat. C » → A main, B main, C featuring
 *   « A feat. B & C » → A main, B featuring, C featuring
 *
 * Indice : une expression régulière avec \b (limite de mot) et le drapeau i
 * reconnaît les trois mots-clés en une fois.
 */
export function toCreditRoles(
  credit: readonly ArtistCreditRow[]
): CreditRole[] {
  throw new Error(
    `TODO : toCreditRoles() n'est pas encore implémentée (${credit.length} artistes reçus)`
  )
}
