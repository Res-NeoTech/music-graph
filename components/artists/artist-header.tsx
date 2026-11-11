import { ArtistMeta } from "@/components/artists/artist-meta"
import { ArtistAvatar } from "@/components/artists/artist-type"
import type { Artist } from "@/lib/types"

/** En-tête de la page artiste : pastille, nom (h1), précision et résumé. */
export function ArtistHeader({ artist }: { artist: Artist }) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
      <ArtistAvatar type={artist.type} size="lg" />
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-balance wrap-break-word sm:text-5xl">
          {artist.name}
        </h1>
        {artist.disambiguation && (
          <p className="mt-2 text-base text-pretty text-muted-foreground sm:text-lg">
            {artist.disambiguation}
          </p>
        )}
        <ArtistMeta artist={artist} className="mt-3 text-sm" />
      </div>
    </header>
  )
}
