// URL d'une photo de Wikimedia Commons, déduites du nom du fichier (seule
// donnée stockée en base, comme le MBID pour les pochettes).

const COMMONS = "https://commons.wikimedia.org/wiki/"

/** Largeur des vignettes : un des paliers standard de Wikimedia, assez pour un avatar de 80 px en écran haute densité. */
export const THUMBNAIL_WIDTH = 250

/** "Kanye West (crop 2).jpg" → "Kanye_West_(crop_2).jpg", encodé pour une URL. */
function encodeFileName(file: string): string {
  return encodeURIComponent(file.trim().replaceAll(" ", "_"))
}

/**
 * Vignette redimensionnée par Wikimedia. Special:FilePath redirige vers le
 * fichier sur upload.wikimedia.org : pas besoin de connaître son chemin exact.
 */
export function commonsThumbnailUrl(file: string, width = THUMBNAIL_WIDTH) {
  return `${COMMONS}Special:FilePath/${encodeFileName(file)}?width=${width}`
}

/** Page du fichier sur Commons : auteur, licence complète, original. */
export function commonsFilePageUrl(file: string) {
  return `${COMMONS}File:${encodeFileName(file)}`
}
