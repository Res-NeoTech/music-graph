export type Artist = {
    mbid: string,
    name: string,
    sortingName: string,
    type: ArtistType | null,
    country: string | null,
    startDate: string | null,
    finishDate: string | null,
    disambiguation: string | null
}

export type ArtistType =
    | "person"
    | "group"
    | "orchestra"
    | "choir"
    | "character"
    | "other"
