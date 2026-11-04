import type {
  ArtistVertex,
  ContainsEdge,
  CreditedEdge,
  MemberOfEdge,
  RecordingVertex,
  ReleaseVertex,
} from "@/lib/db/arango/collections"
import type * as schema from "@/lib/db/postgres/schema"

// ------------------------------------------------------------ PostgreSQL
// Lignes à insérer, déduites du schéma Drizzle. `Required` oblige les
// transformations à remplir chaque colonne (null si la valeur manque) :
// aucune colonne oubliée en silence, et si le schéma change, TypeScript
// signale les transformations à adapter.

type Row<T extends { $inferInsert: object }> = Required<T["$inferInsert"]>

/** Les colonnes import_* sont gérées par load/postgres.ts, pas par la transformation. */
export type ArtistRow = Omit<
  Row<typeof schema.artists>,
  "importStatus" | "importError" | "importDate"
>
export type ReleaseRow = Row<typeof schema.releases>
export type RecordingRow = Row<typeof schema.recordings>
export type TrackRow = Row<typeof schema.tracks>
export type ReleaseArtistRow = Row<typeof schema.releaseArtists>
export type RecordingArtistRow = Row<typeof schema.recordingArtists>
export type CreditRow = Row<typeof schema.credits>
export type MembershipRow = Row<typeof schema.memberships>

export type ArtistType = (typeof schema.artistType.enumValues)[number]
export type ReleaseType = (typeof schema.releaseType.enumValues)[number]
export type ImportStatus = (typeof schema.importStatus.enumValues)[number]

/** Un artiste d'un crédit, sans la release ou le morceau auquel il se rattache. */
export interface ArtistCreditRow {
  artistMbid: string
  /** 1, 2, 3… : ordre dans le crédit */
  position: number
  creditedName: string
  joinPhrase: string
}

// -------------------------------------------------------------- ArangoDB

/** Documents à écrire, rangés par collection. */
export interface GraphDocuments {
  artists: ArtistVertex[]
  releases: ReleaseVertex[]
  recordings: RecordingVertex[]
  credited: CreditedEdge[]
  memberOf: MemberOfEdge[]
  contains: ContainsEdge[]
}
