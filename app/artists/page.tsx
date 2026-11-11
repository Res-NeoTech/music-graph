import { UsersIcon } from "lucide-react"
import type { Metadata } from "next"

import { findAll } from "@/lib/data/artists"
import { ArtistGrid } from "@/components/artists/artist-grid"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { Artist } from "@/lib/types"

export const metadata: Metadata = {
  title: "Artists",
  description: "Browse the artists of the Music Graph catalogue.",
}

async function getArtists(): Promise<Artist[]> {
  const artists = await findAll();

  if (artists === null) {
    return [];
  }

  return artists;
}

export default async function ArtistsPage() {
  const artists = await getArtists()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Artists
        </h1>
        <p className="mt-2 text-muted-foreground">
          {artists.length === 1
            ? "1 artist in the catalogue"
            : `${artists.length.toLocaleString("en-US")} artists in the catalogue`}
        </p>
      </header>

      {artists.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No artists yet</EmptyTitle>
            <EmptyDescription>
              The catalogue is empty for now. Artists appear here once they have
              been imported from MusicBrainz.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ArtistGrid artists={artists} />
      )}
    </div>
  )
}
