import Link from "next/link"

import { ArtistMeta } from "@/components/artists/artist-meta"
import { ArtistAvatar } from "@/components/artists/artist-type"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import type { Artist } from "@/lib/types"

/**
 * Carte d'un artiste, cliquable en entier. Le lien utilise le MBID, jamais le
 * nom (homonymes). Prévue pour être réutilisée dans les résultats de
 * recherche (B2).
 */
export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/artists/${artist.mbid}`}
      className="group flex w-full rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <Card
        size="sm"
        className="w-full transition-shadow group-hover:shadow-lg group-hover:ring-primary/40 dark:group-hover:ring-primary/60"
      >
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-3">
            <ArtistAvatar type={artist.type} />
            <div className="min-w-0">
              <CardTitle>
                <h2 className="line-clamp-2">{artist.name}</h2>
              </CardTitle>
              {artist.disambiguation && (
                <CardDescription className="line-clamp-1">
                  {artist.disambiguation}
                </CardDescription>
              )}
            </div>
          </div>
          <ArtistMeta artist={artist} className="mt-auto" />
        </CardContent>
      </Card>
    </Link>
  )
}
