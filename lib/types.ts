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

export type Release = {
    mbid: string,
    releaseGroupMbid: string,
    title: string,
    /** null : type inconnu sur MusicBrainz (la colonne accepte NULL) */
    type: ReleaseType | null,
    releaseDate: string | null,
    hasCoverArt: boolean
}



/**
 * Un artiste d'un crédit (table release_artists ou recording_artists) :
 * « Kanye West feat. Kid Cudi » = [{ "Kanye West", " feat. " }, { "Kid Cudi", "" }]
 */
export type ArtistCredit = {
    artistMbid: string,
    /** nom tel qu'imprimé, peut différer du nom actuel de l'artiste */
    creditedName: string,
    /** texte qui suit le nom : " & ", " feat. ", "" */
    joinPhrase: string
}

/** Piste d'une release (table tracks) : la place d'un morceau sur l'album. */
export type Track = {
    mbid: string,
    /** morceau joué sur cette piste, pour le lien vers sa page */
    recordingMbid: string,
    discNumber: number,
    position: number,
    /** titre tel qu'imprimé sur cette édition */
    title: string,
    durationMs: number | null
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

export type ReleaseType =
    | "album"
    | "ep"
    | "single"
    | "broadcast"
    | "other"