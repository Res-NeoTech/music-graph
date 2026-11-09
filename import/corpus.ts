import type { ImportStatus } from "./transform/types"

export interface CorpusArtist {
  mbid: string
  /** pour se repérer dans la liste : l'import n'utilise que le MBID */
  name: string
}

export type ImportMode = "all" | "failed"

/**
 * Choisit les artistes du corpus à importer lors de ce lancement.
 *
 * @param corpus   MBID du corpus, dans l'ordre de la liste
 * @param statuses statut d'import de chaque artiste qui a déjà une ligne dans
 *                 la table `artists` (lu par load/postgres.ts). La valeur est
 *                 null pour un artiste créé comme simple crédit d'un autre.
 * @param mode     voir ImportMode
 */
export function selectArtistsToImport(
  corpus: readonly string[],
  statuses: ReadonlyMap<string, ImportStatus | null>,
  mode: ImportMode
): string[] {
  if (mode === "all") {
    return [...new Set(corpus)];
  }

  const failedCorpus: string[] = [];

  for (const mbid of corpus) {
    const status = statuses.get(mbid);

    if (status !== "ok") {
      failedCorpus.push(mbid);
    }
  }

  return [...new Set(failedCorpus)];
}
