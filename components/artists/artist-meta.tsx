import { ArtistTypeBadge } from "@/components/artists/artist-type"
import { countryName, formatActiveYears } from "@/lib/format"
import type { Artist } from "@/lib/types"
import { cn } from "@/lib/utils"

type ArtistMetaProps = {
  artist: Pick<Artist, "type" | "country" | "startDate" | "finishDate">
  className?: string
}

/**
 * Ligne de résumé « Person · United States · Born 1987 », partagée par la
 * carte et l'en-tête. Ne rend rien si aucune de ces informations n'est connue
 * (cas fréquent des artistes découverts via un crédit).
 */
export function ArtistMeta({ artist, className }: ArtistMetaProps) {
  const details = [
    countryName(artist.country),
    formatActiveYears(artist.type, artist.startDate, artist.finishDate),
  ].filter((detail) => detail !== null)

  if (!artist.type && details.length === 0) return null

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground",
        className
      )}
    >
      <ArtistTypeBadge type={artist.type} />
      {details.length > 0 && <span>{details.join(" · ")}</span>}
    </div>
  )
}
