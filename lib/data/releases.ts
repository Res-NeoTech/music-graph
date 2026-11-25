import "server-only";
import { db } from "../db/postgres/client";
import { eq, count, asc } from 'drizzle-orm'
import { releases, tracks } from "../db/postgres/schema";
import type { Release, Track } from "../types"

function toRelease(row: typeof releases.$inferSelect): Release {
    return {
        mbid: row.mbid,
        releaseGroupMbid: row.releaseGroupMbid,
        title: row.title,
        // même union que l'enum release_type de Drizzle : pas besoin de cast
        type: row.type,
        releaseDate: row.releaseDate,
        hasCoverArt: row.hasCoverArt
    }
}

export async function findByMbid(mbid: string): Promise<Release | null> {
    const result = await db
        .select()
        .from(releases)
        .where(eq(releases.mbid, mbid))
        .limit(1)

    const document = result[0]

    if (!document) {
        return null
    }

    return toRelease(document)
}

export async function findPages(page: number, pageSize: number): Promise<{ releases: Release[]; total: number }> {
    const sliceQuery = db
        .select()
        .from(releases)
        .orderBy(releases.title, releases.mbid)
        .limit(pageSize)
        .offset((page - 1) * pageSize)

    const countQuery = db.select({ value: count() }).from(releases);

    const [rows, totalRows] = await Promise.all([sliceQuery, countQuery])

    return {
        releases: rows.map(toRelease),
        total: totalRows[0].value
    };
}

export async function findAll(): Promise<Release[]> {
    const query = await db
        .select()
        .from(releases)
        .orderBy(releases.title, releases.mbid)

    return query.map(toRelease);
}

function toTrack(row: typeof tracks.$inferSelect): Track {
    return {
        mbid: row.mbid,
        recordingMbid: row.recordingMbid,
        discNumber: row.discNumber,
        position: row.position,
        title: row.title,
        durationMs: row.durationMs,
    }
}

/** Tracklist d'une release, dans l'ordre du disque. */
export async function findTracks(releaseMbid: string): Promise<Track[]> {
    const rows = await db
        .select()
        .from(tracks)
        .where(eq(tracks.releaseMbid, releaseMbid))
        .orderBy(asc(tracks.discNumber), asc(tracks.position))

    return rows.map(toTrack)
}