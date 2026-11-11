import { UsersIcon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ArtistGrid } from "@/components/artists/artist-grid"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PaginationNav } from "@/components/pagination-nav"
import { findPages } from "@/lib/data/artists"
import { pageCount, parsePage } from "@/lib/pagination"

export const metadata: Metadata = {
  title: "Artists",
  description: "Browse the artists of the Music Graph catalogue.",
}

type ArtistPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const PAGE_SIZE = 24

// La page 1 n'a qu'une adresse, /artists (et pas aussi /artists?page=1)
function artistsPageHref(page: number): string {
  return page === 1 ? "/artists" : `/artists?page=${page}`
}

export default async function ArtistsPage({ searchParams }: ArtistPageProps) {
  const page = parsePage((await searchParams).page)

  const { artists, total: totalArtists } = await findPages(page, PAGE_SIZE)

  // Page au-delà de la dernière (`?page=9999`) : elle n'existe pas → 404.
  // La page 1 reste valide même sans artiste : elle affiche l'état vide.
  const lastPage = Math.max(pageCount(totalArtists, PAGE_SIZE), 1)
  if (page > lastPage) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Artists
        </h1>
        <p className="mt-2 text-muted-foreground">
          {totalArtists === 1
            ? "1 artist in the catalogue"
            : `${totalArtists.toLocaleString("en-US")} artists in the catalogue`}
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
        <>
          <ArtistGrid artists={artists} />
          <PaginationNav
            page={page}
            lastPage={lastPage}
            hrefForPage={artistsPageHref}
            className="mt-10"
          />
        </>
      )}
    </div>
  )
}
