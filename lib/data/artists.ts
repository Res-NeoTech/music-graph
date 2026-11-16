import "server-only";
import { db } from "../db/postgres/client";
import { eq, count } from 'drizzle-orm'
import { artists } from "../db/postgres/schema";
import { Artist, ArtistType } from "../types";

/** Ligne de la table → type métier : la photo est regroupée dans un objet, ou null. */
function toArtist(row: typeof artists.$inferSelect): Artist {
    return {
        mbid: row.mbid,
        name: row.name,
        sortingName: row.sortingName,
        type: row.type as unknown as ArtistType,
        country: row.country,
        startDate: row.startDate,
        finishDate: row.finishDate,
        disambiguation: row.disambiguation,
        image: row.imageFile
            ? { file: row.imageFile, author: row.imageAuthor, licence: row.imageLicence }
            : null
    }
}

export async function findByMbid(mbid: string): Promise<Artist | null> {
    const result = await db
        .select()
        .from(artists)
        .where(eq(artists.mbid, mbid))
        .limit(1)

    const document = result[0]

    if (!document) {
        return null
    }

    return toArtist(document)
}

export async function findPages(page: number, pageSize: number): Promise<{ artists: Artist[]; total: number }> {
    const sliceQuery = db
        .select()
        .from(artists)
        .orderBy(artists.sortingName, artists.mbid)
        .limit(pageSize)
        .offset((page - 1) * pageSize)

    const countQuery = db.select({ value: count() }).from(artists);

    const [rows, totalRows] = await Promise.all([sliceQuery, countQuery])

    return {
        artists: rows.map(toArtist),
        total: totalRows[0].value
    };
}
