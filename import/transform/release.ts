import type { MbArtistRef, MbRelease } from "../musicbrainz/types"

import { toArtistCreditRows } from "./artist-credit"
import { toArtistRow } from "./artist"
import { creditRelations, toCredits } from "./credits"
import { emptyToNull, toDuration, toPartialDate, toReleaseType } from "./fields"
import type {
  ArtistRow,
  CreditRow,
  RecordingArtistRow,
  RecordingRow,
  ReleaseArtistRow,
  ReleaseRow,
  TrackRow,
} from "./types"

/** Tout ce qu'une release apporte à PostgreSQL. */
export interface ReleaseData {
  release: ReleaseRow
  /** chaque artiste cité (crédits, relations), une fois, à créer avant les associations */
  artists: ArtistRow[]
  releaseArtists: ReleaseArtistRow[]
  recordings: RecordingRow[]
  tracks: TrackRow[]
  recordingArtists: RecordingArtistRow[]
  credits: CreditRow[]
}

export interface TransformReleaseOptions {
  /** codes de la table `roles` : les autres types de relation sont ignorés */
  roles: ReadonlySet<string>
  /**
   * Recopier les crédits de la release entière (souvent le producteur, le
   * mastering) sur chacun de ses morceaux. Plus de liens dans le graphe, au
   * prix d'une approximation : le producteur de l'album n'a pas forcément
   * produit chaque morceau. Point ouvert de docs/postgres/mld.md.
   */
  copyReleaseCredits?: boolean
}

/** Lookup d'une release (avec inc=recordings, artist-credits, *-rels) → lignes. */
export function transformRelease(
  release: MbRelease,
  { roles, copyReleaseCredits = true }: TransformReleaseOptions
): ReleaseData {
  const artists = new Map<string, ArtistRow>()
  const addArtist = (artist: MbArtistRef) => {
    if (!artists.has(artist.id)) artists.set(artist.id, toArtistRow(artist))
  }

  const releaseCredit = release["artist-credit"] ?? []
  releaseCredit.forEach((credit) => addArtist(credit.artist))
  const releaseRelations = copyReleaseCredits ? (release.relations ?? []) : []

  const recordings = new Map<string, RecordingRow>()
  const tracks: TrackRow[] = []
  const recordingArtists: RecordingArtistRow[] = []
  const credits: CreditRow[] = []

  for (const medium of release.media) {
    for (const track of medium.tracks ?? []) {
      const recording = track.recording
      tracks.push({
        mbid: track.id,
        releaseMbid: release.id,
        recordingMbid: recording.id,
        discNumber: medium.position,
        position: track.position,
        title: track.title,
        durationMs: toDuration(track.length),
      })

      // Un même morceau peut apparaître deux fois sur une release :
      // ses crédits ne sont traités qu'une fois.
      if (recordings.has(recording.id)) continue
      recordings.set(recording.id, {
        mbid: recording.id,
        title: recording.title,
        durationMs: toDuration(recording.length),
        disambiguation: emptyToNull(recording.disambiguation),
      })

      const credit = recording["artist-credit"] ?? []
      credit.forEach((c) => addArtist(c.artist))
      for (const row of toArtistCreditRows(credit)) {
        recordingArtists.push({ recordingMbid: recording.id, ...row })
      }

      const relations = creditRelations(recording, roles, releaseRelations)
      relations.forEach((r) => addArtist(r.artist))
      credits.push(...toCredits(recording.id, relations))
    }
  }

  return {
    release: {
      mbid: release.id,
      releaseGroupMbid: release["release-group"].id,
      title: release.title,
      type: toReleaseType(release["release-group"]["primary-type"]),
      releaseDate: toPartialDate(release.date),
      hasCoverArt: release["cover-art-archive"]?.front ?? false,
    },
    artists: [...artists.values()],
    releaseArtists: toArtistCreditRows(releaseCredit).map((row) => ({
      releaseMbid: release.id,
      ...row,
    })),
    recordings: [...recordings.values()],
    tracks,
    recordingArtists,
    credits,
  }
}
