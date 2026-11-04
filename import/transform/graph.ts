import {
  type ArtistVertex,
  type ContainsEdge,
  type CreditedEdge,
  COLLECTIONS,
  type MemberOfEdge,
} from "@/lib/db/arango/collections"

import { toCreditRoles } from "./artist-credit"
import type { ReleaseData } from "./release"
import type { ArtistRow, GraphDocuments, MembershipRow } from "./types"

// Lignes PostgreSQL → documents ArangoDB. Les deux bases reçoivent les mêmes
// données, ArangoDB n'en garde que ce qu'il faut pour le graphe.

/** « artists/164f0d73-… » : identifiant complet d'un document ArangoDB */
const documentId = (collection: string, mbid: string) => `${collection}/${mbid}`

/**
 * Clé d'arête calculée à partir de ses extrémités : la même relation donne
 * toujours la même clé, et la réimporter remplace l'arête au lieu de la dupliquer.
 */
export const edgeKey = (...parts: string[]) => parts.join("_")

export function emptyGraph(): GraphDocuments {
  return {
    artists: [],
    releases: [],
    recordings: [],
    credited: [],
    memberOf: [],
    contains: [],
  }
}

export function toArtistVertex(artist: ArtistRow): ArtistVertex {
  // type omis plutôt que null : en mode « update », une valeur null
  // effacerait le type déjà connu d'un artiste du corpus.
  return artist.type
    ? { _key: artist.mbid, name: artist.name, type: artist.type }
    : { _key: artist.mbid, name: artist.name }
}

function creditedEdge(
  artistMbid: string,
  recordingMbid: string,
  role: string
): CreditedEdge {
  return {
    _key: edgeKey(artistMbid, recordingMbid, role),
    _from: documentId(COLLECTIONS.ARTISTS, artistMbid),
    _to: documentId(COLLECTIONS.RECORDINGS, recordingMbid),
    role,
  }
}

/**
 * Sommets et arêtes d'une release :
 * - contains : release → chaque morceau de la tracklist ;
 * - credited : artiste → morceau, une arête par rôle. Rôles des crédits
 *   (producer, vocal…) et du crédit d'artiste (main / featuring).
 */
export function releaseToGraph(data: ReleaseData): GraphDocuments {
  const releaseId = documentId(COLLECTIONS.RELEASES, data.release.mbid)

  const contains: ContainsEdge[] = data.tracks.map((track) => ({
    _key: edgeKey(track.releaseMbid, track.recordingMbid),
    _from: releaseId,
    _to: documentId(COLLECTIONS.RECORDINGS, track.recordingMbid),
  }))

  const credited = data.credits.map((c) =>
    creditedEdge(c.artistMbid, c.recordingMbid, c.roleCode)
  )
  const creditsByRecording = Map.groupBy(
    data.recordingArtists,
    (row) => row.recordingMbid
  )
  for (const [recordingMbid, rows] of creditsByRecording) {
    for (const { artistMbid, role } of toCreditRoles(rows)) {
      credited.push(creditedEdge(artistMbid, recordingMbid, role))
    }
  }

  return {
    ...emptyGraph(),
    artists: data.artists.map(toArtistVertex),
    releases: [{ _key: data.release.mbid, title: data.release.title }],
    recordings: data.recordings.map((r) => ({ _key: r.mbid, title: r.title })),
    contains: uniqueByKey(contains),
    credited: uniqueByKey(credited),
  }
}

/** Sommets d'un artiste du corpus et des artistes liés, arêtes member_of (membre → groupe). */
export function artistToGraph(
  artist: ArtistRow,
  relatedArtists: readonly ArtistRow[],
  memberships: readonly MembershipRow[]
): GraphDocuments {
  const memberOf: MemberOfEdge[] = memberships.map((m) => ({
    _key: edgeKey(m.memberMbid, m.groupMbid),
    _from: documentId(COLLECTIONS.ARTISTS, m.memberMbid),
    _to: documentId(COLLECTIONS.ARTISTS, m.groupMbid),
  }))

  return {
    ...emptyGraph(),
    artists: uniqueByKey([artist, ...relatedArtists].map(toArtistVertex)),
    memberOf: uniqueByKey(memberOf),
  }
}

/** Retire les documents de même _key (le premier est gardé). */
function uniqueByKey<T extends { _key: string }>(documents: T[]): T[] {
  return [...new Map(documents.map((d) => [d._key, d])).values()]
}
