export type Artist = {
    mbid: string,
    name: string,
    sortingName: string,
    type: ArtistType | null,
    country: string | null,
    startDate: string | null,
    finishDate: string | null,
    disambiguation: string | null,
    /** null : pas de photo (l'avatar affiche l'icône du type) */
    image: ArtistImage | null
}

/** Photo de Wikimedia Commons, avec son crédit (obligatoire pour CC BY / BY-SA). */
export type ArtistImage = {
    /** nom du fichier sur Commons, sans « File: » */
    file: string,
    author: string | null,
    licence: string | null
}

export type ArtistType =
    | "person"
    | "group"
    | "orchestra"
    | "choir"
    | "character"
    | "other"
