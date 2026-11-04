import type { MbArtistRef, MbRecording, MbRelation } from "../musicbrainz/types"

import type { CreditRow } from "./types"

/** Relation dont la cible est un artiste. */
export type ArtistRelation = MbRelation & { artist: MbArtistRef }

/**
 * Relations d'un morceau qui deviennent des crédits (table `credits`) :
 * - celles du morceau vers un artiste : musiciens, producteurs, ingénieurs ;
 * - celles de l'œuvre enregistrée (relation "performance") : compositeurs,
 *   paroliers. Ce sont des relations de l'œuvre chez MusicBrainz, rattachées
 *   ici au morceau ;
 * - `releaseRelations` : relations de la release entière (producteur de
 *   l'album…), recopiées sur chaque morceau.
 *
 * Seuls les types présents dans la table `roles` (paramètre `roles`) sont gardés.
 */
export function creditRelations(
  recording: MbRecording,
  roles: ReadonlySet<string>,
  releaseRelations: readonly MbRelation[] = []
): ArtistRelation[] {
  const own = recording.relations ?? []
  const fromWorks = own
    .filter((r) => r.type === "performance" && r["target-type"] === "work")
    .flatMap((r) => r.work?.relations ?? [])

  return [...own, ...fromWorks, ...releaseRelations].filter(
    (r): r is ArtistRelation =>
      r["target-type"] === "artist" &&
      r.artist !== undefined &&
      roles.has(r.type)
  )
}

/**
 * Lignes `credits` d'un morceau. Un artiste peut avoir plusieurs relations du
 * même type sur un morceau (une par instrument : guitare, puis piano). Comme
 * (morceau, artiste, rôle) est la clé primaire, elles sont fusionnées en une
 * ligne dont `detail` réunit les attributs : "guitar, piano".
 */
export function toCredits(
  recordingMbid: string,
  relations: readonly ArtistRelation[]
): CreditRow[] {
  const merged = new Map<
    string,
    { relation: ArtistRelation; details: Set<string> }
  >()

  for (const relation of relations) {
    const key = `${relation.artist.id}|${relation.type}`
    let entry = merged.get(key)
    if (!entry) {
      entry = { relation, details: new Set() }
      merged.set(key, entry)
    }
    for (const attribute of relation.attributes) entry.details.add(attribute)
  }

  return [...merged.values()].map(({ relation, details }) => ({
    recordingMbid,
    artistMbid: relation.artist.id,
    roleCode: relation.type,
    detail: details.size > 0 ? [...details].join(", ") : null,
  }))
}
