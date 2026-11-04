import { and, eq, getTableColumns, inArray, ne, sql } from "drizzle-orm"
import type { PgTable } from "drizzle-orm/pg-core"

import type { db as postgresDb } from "@/lib/db/postgres/client"
import {
  artists,
  credits,
  memberships,
  recordingArtists,
  recordings,
  releaseArtists,
  releases,
  roles,
  tracks,
} from "@/lib/db/postgres/schema"

import type { ReleaseData } from "../transform/release"
import type { ArtistRow, ImportStatus, MembershipRow } from "../transform/types"

// Écritures du script d'import dans PostgreSQL.
// Idempotence (B1) : chaque ligne est identifiée par son MBID, et l'insertion
// devient une mise à jour si la ligne existe déjà (INSERT … ON CONFLICT).
// Relancer l'import ne crée donc jamais de doublon.

/** La connexion est passée en paramètre : un test peut fournir une autre base. */
export type PostgresDb = typeof postgresDb
type Transaction = Parameters<Parameters<PostgresDb["transaction"]>[0]>[0]

/** Codes de la table `roles` : les relations d'un autre type sont ignorées. */
export async function loadRoleCodes(db: PostgresDb): Promise<Set<string>> {
  const rows = await db.select({ code: roles.code }).from(roles)
  return new Set(rows.map((row) => row.code))
}

/**
 * Statut d'import des artistes demandés qui ont déjà une ligne.
 * Un artiste absent de la Map n'a pas encore de ligne.
 */
export async function loadImportStatuses(
  db: PostgresDb,
  mbids: readonly string[]
): Promise<Map<string, ImportStatus | null>> {
  if (mbids.length === 0) return new Map()
  const rows = await db
    .select({ mbid: artists.mbid, status: artists.importStatus })
    .from(artists)
    .where(inArray(artists.mbid, [...mbids]))
  return new Map(rows.map((row) => [row.mbid, row.status]))
}

/**
 * Début de l'import d'un artiste du corpus : ses informations sont mises à
 * jour et son statut passe à « pending ». Si l'import est interrompu
 * (Ctrl+C, panne), le statut reste « pending » et `--failed` le reprendra.
 */
export async function startArtistImport(db: PostgresDb, artist: ArtistRow) {
  const row = {
    ...artist,
    importStatus: "pending" as const,
    importError: null,
    importDate: new Date(),
  }
  await db
    .insert(artists)
    .values(row)
    .onConflictDoUpdate({
      target: artists.mbid,
      set: excluded(artists, [
        "name",
        "sortingName",
        "type",
        "country",
        "startDate",
        "finishDate",
        "disambiguation",
        "importStatus",
        "importError",
        "importDate",
      ]),
    })
}

/**
 * Fin de l'import : « ok », ou « failed » avec le message d'erreur.
 * Sans effet si l'artiste n'a pas de ligne (le tout premier appel a échoué).
 */
export async function finishArtistImport(
  db: PostgresDb,
  mbid: string,
  error?: unknown
) {
  await db
    .update(artists)
    .set({
      importStatus: error === undefined ? "ok" : "failed",
      importError: error === undefined ? null : errorMessage(error),
      importDate: new Date(),
    })
    .where(eq(artists.mbid, mbid))
}

/** Membres d'un groupe, ou groupes d'une personne. */
export async function saveMemberships(
  db: PostgresDb,
  relatedArtists: readonly ArtistRow[],
  rows: readonly MembershipRow[]
) {
  await db.transaction(async (tx) => {
    await insertArtistStubs(tx, relatedArtists)
    if (rows.length === 0) return
    await tx
      .insert(memberships)
      .values([...rows])
      .onConflictDoUpdate({
        target: [memberships.groupMbid, memberships.memberMbid],
        set: excluded(memberships, ["startDate", "finishDate", "detail"]),
      })
  })
}

/**
 * Une release et tout ce qui en dépend, dans une transaction : en cas
 * d'erreur, rien n'est écrit.
 *
 * Les associations (pistes, crédits d'artiste, crédits) sont supprimées puis
 * réinsérées : un réimport remplace l'état précédent au lieu de s'y ajouter.
 * Limite : un morceau présent sur deux releases importées garde les crédits
 * calculés lors de la dernière (même relations, sauf les crédits recopiés
 * depuis la release, voir copyReleaseCredits).
 */
export async function saveRelease(db: PostgresDb, data: ReleaseData) {
  const releaseMbid = data.release.mbid
  const recordingMbids = data.recordings.map((r) => r.mbid)

  await db.transaction(async (tx) => {
    await insertArtistStubs(tx, data.artists)

    // Une seule édition par album (UNIQUE release_group_mbid). Si un import
    // précédent avait choisi une autre édition, elle est supprimée ; ses
    // pistes et son crédit d'artiste suivent (ON DELETE CASCADE).
    await tx
      .delete(releases)
      .where(
        and(
          eq(releases.releaseGroupMbid, data.release.releaseGroupMbid),
          ne(releases.mbid, releaseMbid)
        )
      )
    await tx
      .insert(releases)
      .values(data.release)
      .onConflictDoUpdate({
        target: releases.mbid,
        set: excluded(releases, [
          "releaseGroupMbid",
          "title",
          "type",
          "releaseDate",
          "hasCoverArt",
        ]),
      })

    if (data.recordings.length > 0) {
      await tx
        .insert(recordings)
        .values(data.recordings)
        .onConflictDoUpdate({
          target: recordings.mbid,
          set: excluded(recordings, ["title", "durationMs", "disambiguation"]),
        })
    }

    // remplacer les associations
    await tx
      .delete(releaseArtists)
      .where(eq(releaseArtists.releaseMbid, releaseMbid))
    await tx.delete(tracks).where(eq(tracks.releaseMbid, releaseMbid))
    if (recordingMbids.length > 0) {
      await tx
        .delete(recordingArtists)
        .where(inArray(recordingArtists.recordingMbid, recordingMbids))
      await tx
        .delete(credits)
        .where(inArray(credits.recordingMbid, recordingMbids))
    }

    if (data.releaseArtists.length > 0) {
      await tx.insert(releaseArtists).values(data.releaseArtists)
    }
    if (data.tracks.length > 0) await tx.insert(tracks).values(data.tracks)
    if (data.recordingArtists.length > 0) {
      await tx.insert(recordingArtists).values(data.recordingArtists)
    }
    if (data.credits.length > 0) await tx.insert(credits).values(data.credits)
  })
}

/**
 * Artistes cités (crédits, relations), créés avant les lignes qui les
 * référencent (clés étrangères). DO NOTHING : si l'artiste existe déjà, on ne
 * touche à rien, pour ne pas écraser les données complètes (dates, statut)
 * d'un artiste du corpus avec les informations partielles d'une relation.
 */
async function insertArtistStubs(tx: Transaction, rows: readonly ArtistRow[]) {
  if (rows.length === 0) return
  await tx
    .insert(artists)
    .values([...rows])
    .onConflictDoNothing({ target: artists.mbid })
}

/**
 * Partie SET d'un ON CONFLICT DO UPDATE : `colonne = EXCLUDED.colonne`.
 * EXCLUDED désigne la ligne qu'on voulait insérer : en cas de conflit, la
 * ligne existante prend ses valeurs. Fonctionne aussi pour plusieurs lignes.
 */
function excluded<T extends PgTable>(
  table: T,
  keys: readonly (keyof T["_"]["columns"] & string)[]
) {
  const columns = getTableColumns(table)
  return Object.fromEntries(
    keys.map((key) => [key, sql`excluded.${sql.identifier(columns[key].name)}`])
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
