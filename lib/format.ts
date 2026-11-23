import type { ArtistType } from "@/lib/types"

// Fonctions pures de mise en forme pour l'affichage.

const LOCALE = "en-US"

const fullDate = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "long",
  timeZone: "UTC",
})
const monthAndYear = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

/**
 * Date partielle MusicBrainz ("1991", "1991-09" ou "1991-09-24") en texte :
 * on n'affiche que la précision connue, jamais un jour ou un mois inventé.
 */
export function formatPartialDate(date: string | null): string | null {
  if (!date) return null

  const [year, month, day] = date.split("-").map(Number)
  if (!Number.isInteger(year)) return null

  if (!month) return String(year)
  if (!day) return monthAndYear.format(Date.UTC(year, month - 1))
  return fullDate.format(Date.UTC(year, month - 1, day))
}

/** Durée en ms en "4:41", ou "1:02:03" au-delà d'une heure. null si inconnue. */
export function formatDuration(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return null

  const totalSeconds = Math.round(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = String(totalSeconds % 60).padStart(2, "0")

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`
}

/**
 * Durée totale d'une liste de pistes. null si une seule durée manque : un
 * total partiel serait faux sans qu'on le voie.
 */
export function totalDuration(
  durations: readonly (number | null)[]
): number | null {
  if (durations.length === 0) return null
  let total = 0
  for (const ms of durations) {
    if (ms === null) return null
    total += ms
  }
  return total
}

function yearOf(date: string | null): string | null {
  return date ? date.slice(0, 4) : null
}

/**
 * Résumé court pour les cartes : "1994 – 2022", "Born 1987" (personne)
 * ou "Since 2008" (groupe, chœur…). null si le début est inconnu.
 */
export function formatActiveYears(
  type: ArtistType | null,
  startDate: string | null,
  finishDate: string | null
): string | null {
  const start = yearOf(startDate)
  const finish = yearOf(finishDate)

  if (!start) return null
  if (finish) return `${start} – ${finish}`
  return type === "person" ? `Born ${start}` : `Since ${start}`
}

/** Libellés des dates de début et de fin, qui dépendent du type d'artiste. */
export function lifeSpanLabels(type: ArtistType | null): {
  start: string
  finish: string
} {
  switch (type) {
    case "person":
      return { start: "Born", finish: "Died" }
    case "group":
    case "orchestra":
    case "choir":
      return { start: "Founded", finish: "Dissolved" }
    default:
      return { start: "Started", finish: "Ended" }
  }
}

const regionNames = new Intl.DisplayNames([LOCALE], { type: "region" })

// Codes propres à MusicBrainz, absents de la norme ISO 3166-1.
const MUSICBRAINZ_REGIONS: Record<string, string> = {
  XW: "Worldwide",
  XE: "Europe",
}

/** Code pays ISO à deux lettres en nom lisible ("US" → "United States"). */
export function countryName(code: string | null): string | null {
  if (!code) return null

  const normalized = code.trim().toUpperCase()
  if (normalized in MUSICBRAINZ_REGIONS) return MUSICBRAINZ_REGIONS[normalized]

  try {
    return regionNames.of(normalized) ?? normalized
  } catch {
    return normalized
  }
}
