import type { MbArtist } from "../musicbrainz/types"

import { emptyToNull, toArtistType, toPartialDate } from "./fields"
import type { ArtistRow } from "./types"

/**
 * Ligne `artists`. Fonctionne pour un artiste complet (lookup) comme pour un
 * artiste lu dans un crédit ou une relation : ce dernier n'a pas de
 * "life-span", ses dates restent alors à null.
 */
export function toArtistRow(artist: MbArtist): ArtistRow {
  const lifeSpan = artist["life-span"]
  return {
    mbid: artist.id,
    name: artist.name,
    sortingName: artist["sort-name"],
    type: toArtistType(artist.type),
    country: emptyToNull(artist.country),
    startDate: toPartialDate(lifeSpan?.begin),
    finishDate: toPartialDate(lifeSpan?.end),
    disambiguation: emptyToNull(artist.disambiguation),
  }
}
