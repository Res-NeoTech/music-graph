import { db } from "../db/postgres/client";
import { eq } from 'drizzle-orm'
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

export async function findAll(): Promise<Artist[] | null> {
    const result = await db
        .select()
        .from(artists)

    const documents = result

    if (!documents) {
        return null
    }

    return documents.map((document) => {
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
    });
}