import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"

import { findByMbid } from "@/lib/data/artists"
import { ArtistFacts } from "@/components/artists/artist-facts"
import { ArtistHeader } from "@/components/artists/artist-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { isMbid } from "@/lib/mbid"
import type { Artist } from "@/lib/types"

type ArtistPageProps = {
  // Next.js 16 : `params` est une promesse
  params: Promise<{ mbid: string }>
}

// `cache` (React) : generateMetadata et la page demandent le même artiste ;
// la fonction n'est exécutée qu'une fois par requête, donc une seule lecture
// en base une fois branchée.
const getArtist = cache(async (mbid: string): Promise<Artist | null> => {
  if (!isMbid(mbid)) return null

  const artist = findByMbid(mbid);

  return (
    artist
  )
})

export async function generateMetadata({
  params,
}: ArtistPageProps): Promise<Metadata> {
  const { mbid } = await params
  const artist = await getArtist(mbid)

  if (!artist) return {}

  return {
    title: artist.name,
    description: artist.disambiguation
      ? `${artist.name} (${artist.disambiguation}) on Music Graph.`
      : `${artist.name} on Music Graph.`,
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { mbid } = await params
  const artist = await getArtist(mbid)

  if (!artist) notFound()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/artists" />}>
              Artists
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{artist.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ArtistHeader artist={artist} />
      <ArtistFacts artist={artist} />
    </div>
  )
}
