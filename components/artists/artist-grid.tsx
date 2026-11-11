import { ArtistCard } from "@/components/artists/artist-card"
import type { Artist } from "@/lib/types"

/** Grille de cartes : 1 colonne sur mobile, 2 sur tablette, 3 sur écran large. */
export function ArtistGrid({ artists }: { artists: Artist[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {artists.map((artist) => (
        <li key={artist.mbid} className="flex">
          <ArtistCard artist={artist} />
        </li>
      ))}
    </ul>
  )
}
