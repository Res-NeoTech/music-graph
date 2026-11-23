import { Disc3Icon } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ReleaseGrid } from "@/components/releases/release-grid"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PaginationNav } from "@/components/pagination-nav"
import { findPages } from "@/lib/data/releases"
import { pageCount, parsePage } from "@/lib/pagination"

export const metadata: Metadata = {
  title: "Releases",
  description: "Browse the releases of the Music Graph catalogue.",
}

type ReleasesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const PAGE_SIZE = 24

function releasesPageHref(page: number): string {
  return page === 1 ? "/releases" : `/releases?page=${page}`
}

export default async function ReleasesPage({
  searchParams,
}: ReleasesPageProps) {
  const page = parsePage((await searchParams).page)

  const { releases, total: totalReleases } = await findPages(page, PAGE_SIZE)

  const lastPage = Math.max(pageCount(totalReleases, PAGE_SIZE), 1)
  if (page > lastPage) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Releases
        </h1>
        <p className="mt-2 text-muted-foreground">
          {totalReleases === 1
            ? "1 release in the catalogue"
            : `${totalReleases.toLocaleString("en-US")} releases in the catalogue`}
        </p>
      </header>

      {releases.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Disc3Icon />
            </EmptyMedia>
            <EmptyTitle>No releases yet</EmptyTitle>
            <EmptyDescription>
              The catalogue is empty for now. Releases appear here once they have
              been imported from MusicBrainz.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <ReleaseGrid releases={releases} />
          <PaginationNav
            page={page}
            lastPage={lastPage}
            hrefForPage={releasesPageHref}
            className="mt-10"
          />
        </>
      )}
    </div>
  )
}