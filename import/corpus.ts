import type { ImportStatus } from "./transform/types"

export interface CorpusArtist {
  mbid: string
  /** pour se repérer dans la liste : l'import n'utilise que le MBID */
  name: string
}

/**
 * TODO (Maksym) — les ~100 artistes de départ, d'un même genre musical
 * (cahier des charges, « Périmètre »). Choisir des artistes dont les crédits
 * sont bien renseignés sur MusicBrainz.
 *
 * Le MBID se lit dans l'URL de la page MusicBrainz de l'artiste :
 *   https://musicbrainz.org/artist/164f0d73-1234-4e2c-8743-d77bf2191051 → Ye
 *
 * En attendant, un artiste s'importe seul avec :
 *   npm run import -- --artist 164f0d73-1234-4e2c-8743-d77bf2191051
 */
export const CORPUS: readonly CorpusArtist[] = [
  // { mbid: "164f0d73-1234-4e2c-8743-d77bf2191051", name: "Ye" },
]

/**
 * - "all" : tout le corpus (met à jour les artistes déjà importés) ;
 * - "failed" : seulement ce qui n'a pas réussi, pour reprendre après une
 *   erreur ou une interruption.
 */
export type ImportMode = "all" | "failed"

/**
 * TODO (Maksym) — à implémenter. Tests : import/corpus.test.ts
 *
 * Choisit les artistes du corpus à importer lors de ce lancement.
 *
 * @param corpus   MBID du corpus, dans l'ordre de la liste
 * @param statuses statut d'import de chaque artiste qui a déjà une ligne dans
 *                 la table `artists` (lu par load/postgres.ts). La valeur est
 *                 null pour un artiste créé comme simple crédit d'un autre.
 * @param mode     voir ImportMode
 *
 * Règles :
 * - mode "all" : tous les artistes du corpus ;
 * - mode "failed" : seulement ceux dont le statut n'est pas "ok", c'est-à-dire
 *   "failed", "pending" (import interrompu), null, ou absent de `statuses`
 *   (le tout premier appel à MusicBrainz a échoué, l'artiste n'a pas encore
 *   de ligne : docs/postgres/mld.md, « Statut d'import sur l'artiste ») ;
 * - dans les deux modes, l'ordre du corpus est conservé et un MBID présent
 *   deux fois dans la liste n'est importé qu'une fois.
 */
export function selectArtistsToImport(
  corpus: readonly string[],
  statuses: ReadonlyMap<string, ImportStatus | null>,
  mode: ImportMode
): string[] {
  throw new Error(
    `TODO : selectArtistsToImport() n'est pas encore implémentée ` +
      `(${corpus.length} artistes, ${statuses.size} statuts, mode ${mode})`
  )
}
