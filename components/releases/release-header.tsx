import { ArtistCreditLine } from "@/components/artists/artist-credit"
import { ReleaseCover } from "@/components/releases/release-cover"
import { ReleaseTypeBadge } from "@/components/releases/release-type"
import { formatPartialDate } from "@/lib/format"
import type { ArtistCredit, Release } from "@/lib/types"

type ReleaseHeaderProps = {
  release: Release
  /** crédit d'artiste de l'album ; facultatif tant que le DAL ne le fournit pas */
  artists?: readonly ArtistCredit[]
}

/**
 * En-tête de la page d'une release : pochette, titre (h1), artistes, type et
 * date de sortie. Même structure que ArtistHeader, avec une pochette plus
 * grande que l'avatar : c'est l'image principale d'un album.
 */
export function ReleaseHeader({ release, artists = [] }: ReleaseHeaderProps) {
  const date = formatPartialDate(release.releaseDate)

  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
      <div className="w-40 shrink-0 overflow-hidden rounded-3xl shadow-md ring-1 ring-foreground/5 sm:w-56 dark:ring-foreground/10">
        {/* 500 px : affichée jusqu'à 224 px, net en écran haute densité */}
        <ReleaseCover release={release} size={500} />
      </div>
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-balance wrap-break-word sm:text-5xl">
          {release.title}
        </h1>
        <ArtistCreditLine
          credits={artists}
          className="mt-2 text-base text-muted-foreground sm:text-lg"
        />
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <ReleaseTypeBadge type={release.type} />
          {date && (
            <time dateTime={release.releaseDate ?? undefined}>{date}</time>
          )}
        </div>
      </div>
    </header>
  )
}
