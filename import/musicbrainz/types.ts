// Réponses JSON brutes de l'API MusicBrainz (https://musicbrainz.org/ws/2/…&fmt=json).
// Seuls les champs lus par l'import sont décrits : l'API en renvoie beaucoup
// plus. Les noms reprennent ceux du JSON ("sort-name", "life-span"…).
// Exemples réels (réduits) : tests/fixtures/musicbrainz/

/** Artiste tel qu'il apparaît dans un crédit ou une relation. */
export interface MbArtistRef {
  id: string
  name: string
  "sort-name": string
  /** "" si aucune */
  disambiguation?: string
  /** "Person", "Group", "Orchestra", "Choir", "Character", "Other" */
  type?: string | null
  /** code ISO 3166-1 : "US", "FR" */
  country?: string | null
}

/** GET /artist/{mbid}?inc=artist-rels */
export interface MbArtist extends MbArtistRef {
  "life-span"?: {
    begin?: string | null
    end?: string | null
    ended?: boolean
  }
  relations?: MbRelation[]
}

/**
 * Crédit d'artiste, un élément par artiste :
 * « A feat. B » = [{ name: "A", joinphrase: " feat. " }, { name: "B", joinphrase: "" }]
 */
export interface MbArtistCredit {
  /** nom tel qu'imprimé, peut différer de artist.name */
  name: string
  /** texte qui suit le nom : " & ", " feat. ", "" */
  joinphrase: string
  artist: MbArtistRef
}

/** Relation entre deux entités MusicBrainz. */
export interface MbRelation {
  /** "member of band", "producer", "instrument", "performance", "composer"… */
  type: string
  /** type de l'entité cible : "artist", "work", "url"… */
  "target-type": string
  /** sens de la relation vu depuis l'entité demandée */
  direction: "forward" | "backward"
  /** précisions : ["guitar"], ["lead vocals"], ["assistant"], ["original"]… */
  attributes: string[]
  /** dates partielles : "1987", "1990-09", "1994-04-05" */
  begin?: string | null
  end?: string | null
  ended?: boolean
  /** présent si target-type = "artist" */
  artist?: MbArtistRef
  /** présent si target-type = "work" */
  work?: MbWork
}

/** Œuvre (la composition, indépendante de ses enregistrements). */
export interface MbWork {
  id: string
  title: string
  /** absent pour une œuvre liée à une autre œuvre (pas de niveau supplémentaire) */
  relations?: MbRelation[]
}

export interface MbReleaseGroup {
  id: string
  title: string
  /** "Album", "EP", "Single", "Broadcast", "Other" */
  "primary-type": string | null
  /** ["Compilation"], ["Live"], ["Remix"]… vide pour un album studio */
  "secondary-types": string[]
  /** date de la toute première édition, "" si inconnue */
  "first-release-date"?: string
}

/** Release renvoyée par GET /release?artist={mbid}&inc=release-groups (browse). */
export interface MbBrowseRelease {
  id: string
  title: string
  /** "Official", "Promotion", "Bootleg", "Pseudo-Release" */
  status: string | null
  /** date partielle, "" ou absente si inconnue */
  date?: string
  disambiguation?: string
  "cover-art-archive": {
    /** true si la Cover Art Archive a une image de face pour cette release */
    front: boolean
  }
  "release-group": MbReleaseGroup
}

/** Page d'un browse de releases. */
export interface MbReleaseBrowse {
  /** nombre total de releases, toutes pages confondues */
  "release-count": number
  "release-offset": number
  releases: MbBrowseRelease[]
}

/**
 * GET /release/{mbid}?inc=artist-credits+recordings+release-groups
 *   +artist-rels+recording-level-rels+work-rels+work-level-rels
 */
export interface MbRelease extends MbBrowseRelease {
  "artist-credit": MbArtistCredit[]
  /** relations de la release entière (souvent : producteur, mastering) */
  relations?: MbRelation[]
  /** disques */
  media: MbMedium[]
}

export interface MbMedium {
  /** numéro du disque, à partir de 1 */
  position: number
  tracks?: MbTrack[]
}

/** Piste : la place d'un enregistrement sur une release. */
export interface MbTrack {
  id: string
  /** position sur le disque : 1, 2, 3… */
  position: number
  /** numéro imprimé : "1", "A1"… (non utilisé) */
  number: string
  /** titre imprimé sur cette édition */
  title: string
  /** durée sur cette édition, en ms */
  length: number | null
  recording: MbRecording
}

/** Morceau (enregistrement). */
export interface MbRecording {
  id: string
  title: string
  /** durée en ms */
  length: number | null
  disambiguation?: string
  "artist-credit"?: MbArtistCredit[]
  /** musiciens, producteurs, ingénieurs… et le lien vers l'œuvre ("performance") */
  relations?: MbRelation[]
}
