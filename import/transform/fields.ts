import { artistType, releaseType } from "@/lib/db/postgres/schema"

import type { ArtistType, ReleaseType } from "./types"

// Conversions de champs isolés, réutilisées par toutes les transformations.

const PARTIAL_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/

/**
 * Date partielle MusicBrainz : "1991", "1991-09" ou "1991-09-24".
 * Renvoie null si la date est absente, vide ou mal formée : la colonne a une
 * contrainte CHECK avec la même expression régulière.
 */
export function toPartialDate(value: string | null | undefined): string | null {
  return value && PARTIAL_DATE.test(value) ? value : null
}

/** MusicBrainz renvoie "" quand il n'y a pas de valeur ; on stocke NULL. */
export function emptyToNull(value: string | null | undefined): string | null {
  return value ? value : null
}

/** Durée en ms. null si inconnue : la colonne exige une valeur > 0. */
export function toDuration(ms: number | null | undefined): number | null {
  return ms && ms > 0 ? Math.round(ms) : null
}

/** "Group" → "group". null si absent ou inconnu de l'enum PostgreSQL. */
export function toArtistType(
  value: string | null | undefined
): ArtistType | null {
  return findEnumValue(artistType.enumValues, value)
}

/** "Album" → "album", "EP" → "ep". null si absent ou inconnu de l'enum. */
export function toReleaseType(
  value: string | null | undefined
): ReleaseType | null {
  return findEnumValue(releaseType.enumValues, value)
}

function findEnumValue<T extends string>(
  values: readonly T[],
  value: string | null | undefined
): T | null {
  const lower = value?.toLowerCase()
  return values.find((v) => v === lower) ?? null
}
