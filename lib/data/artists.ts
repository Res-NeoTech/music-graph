import "server-only";
import { db } from "../db/postgres/client";
import { eq, count } from 'drizzle-orm'
import { artists } from "../db/postgres/schema";
import { Artist, ArtistType } from "../types";

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

    return {
        mbid: document.mbid,
        name: document.name,
        sortingName: document.sortingName,
        type: document.type as unknown as ArtistType,
        country: document.country,
        startDate: document.startDate,
        finishDate: document.finishDate,
        disambiguation: document.disambiguation
    }
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
        artists: rows,
        total: totalRows[0].value
    };
}