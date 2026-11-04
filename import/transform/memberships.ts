import type { MbArtist } from "../musicbrainz/types"

import { toArtistRow } from "./artist"
import type { ArtistRow, MembershipRow } from "./types"

/** Type de la relation MusicBrainz entre un membre et son groupe. */
export const MEMBER_OF_BAND = "member of band"

/**
 * Artistes à l'autre bout des relations « member of band » (les membres d'un
 * groupe, ou les groupes d'une personne). Leur ligne `artists` doit exister
 * avant celle de `memberships`, à cause des clés étrangères.
 */
export function membershipArtists(artist: MbArtist): ArtistRow[] {
  const related = new Map<string, ArtistRow>()
  for (const relation of artist.relations ?? []) {
    if (relation.type === MEMBER_OF_BAND && relation.artist) {
      related.set(relation.artist.id, toArtistRow(relation.artist))
    }
  }
  return [...related.values()]
}

/**
 * TODO (Maksym) — à implémenter. Tests : import/transform/memberships.test.ts
 *
 * Relations « member of band » d'un artiste (lookup avec inc=artist-rels)
 * → lignes de la table `memberships`.
 *
 * 1. Ne garder que les relations de type MEMBER_OF_BAND qui ont un `artist`.
 * 2. Le sens (`direction`) dit qui est le groupe :
 *    - "backward" : on a importé un groupe, `relation.artist` en est membre
 *      → groupMbid = artist.id, memberMbid = relation.artist.id
 *    - "forward" : on a importé une personne (Ye), membre du groupe
 *      `relation.artist` (KIDS SEE GHOSTS)
 *      → groupMbid = relation.artist.id, memberMbid = artist.id
 * 3. MusicBrainz crée une relation par instrument et par période : un membre
 *    qui chante et joue de la guitare en a 2, un membre parti puis revenu
 *    en a une par période.
 *    (groupe, membre) étant la clé primaire, les fusionner en UNE ligne :
 *    - startDate : la plus ancienne date de début (`begin`), null si aucune ;
 *    - finishDate : la plus récente date de fin (`end`). null si aucune, ou si
 *      une des relations n'est pas terminée (`ended` vaut false) : le membre
 *      fait encore partie du groupe ;
 *    - detail : les `attributes` (instruments, voix), sans doublon, dans
 *      l'ordre de première apparition, séparés par ", ". L'attribut "original"
 *      (membre fondateur) n'est pas un instrument : l'ignorer. null si vide.
 * 4. Passer les dates par toPartialDate() (./fields), comme partout ailleurs.
 *    Les dates partielles se comparent comme des chaînes : "1987" < "1988-05".
 *
 * Chaque ligne a les 5 colonnes, même à null (le type MembershipRow l'impose).
 * L'ordre du tableau renvoyé n'a pas d'importance.
 */
export function toMemberships(artist: MbArtist): MembershipRow[] {
  throw new Error(
    `TODO : toMemberships() n'est pas encore implémentée (artiste ${artist.id})`
  )
}
