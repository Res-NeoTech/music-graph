import type { MbBrowseRelease } from "../musicbrainz/types"

/**
 * Types d'album importés, au format du paramètre `type` de l'API.
 * Les singles sont exclus : ils ajoutent surtout des doublons de morceaux
 * (docs/postgres/mld.md, « Points à trancher »).
 */
export const IMPORTED_RELEASE_TYPES = ["album", "ep"] as const

/**
 * TODO (Maksym) — à implémenter. Tests : import/transform/releases.test.ts
 *
 * Garde UNE édition (release) par album (release group). Un album a souvent
 * des dizaines d'éditions (pays, formats, rééditions) : Graduation en a 24,
 * My Beautiful Dark Twisted Fantasy 17. La table `releases` impose
 * UNIQUE (release_group_mbid).
 *
 * 1. Filtrer : garder les releases
 *    - dont `status` vaut "Official" ;
 *    - dont le release group a pour "primary-type" un des IMPORTED_RELEASE_TYPES
 *      (attention à la casse : l'API renvoie "Album" et "EP") ;
 *    - dont le release group n'a aucun "secondary-types" : exclut les
 *      compilations, les live, les remix, les bandes originales…
 * 2. Regrouper par release group ("release-group".id).
 * 3. Dans chaque groupe, choisir l'édition selon ces critères, dans l'ordre :
 *    a. sa `date` est égale au "first-release-date" du release group
 *       (c'est une édition originale). Une date vide ne compte pas, même si
 *       "first-release-date" est vide aussi ;
 *    b. elle a une pochette ("cover-art-archive".front) ;
 *    c. sa date est la plus ancienne. Une release sans date passe après les
 *       autres. Les dates partielles se comparent comme des chaînes :
 *       "1991" < "1991-09-24" ;
 *    d. à égalité, le plus petit MBID (comparaison de chaînes).
 *
 * Le critère d. rend le choix déterministe : relancer l'import choisit
 * toujours la même édition, ce qui garde l'import idempotent.
 * L'ordre du tableau renvoyé n'a pas d'importance.
 *
 * Indice : Map.groupBy() pour regrouper, puis une fonction de comparaison
 * passée à toSorted() : chaque critère départage seulement si les précédents
 * sont à égalité.
 */
export function pickReleases(
  releases: readonly MbBrowseRelease[]
): MbBrowseRelease[] {
  throw new Error(
    `TODO : pickReleases() n'est pas encore implémentée (${releases.length} releases reçues)`
  )
}
