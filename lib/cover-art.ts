// URL des pochettes de la Cover Art Archive, déduites du MBID de la release
// (rien n'est stocké en base, voir docs/postgres/mld.md).

/** Tailles de vignette proposées par la Cover Art Archive, en pixels. */
export type CoverSize = 250 | 500 | 1200

/** Image de face d'une release. La CAA redirige vers le fichier sur archive.org. */
export function coverArtUrl(releaseMbid: string, size: CoverSize = 250) {
  return `https://coverartarchive.org/release/${releaseMbid}/front-${size}`
}
