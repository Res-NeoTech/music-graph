import { ExternalLinkIcon } from "lucide-react"

import { releaseTypeLabel } from "@/components/releases/release-type"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDuration, formatPartialDate, totalDuration } from "@/lib/format"
import type { Release, Track } from "@/lib/types"

type ReleaseFactsProps = {
  release: Release
  /** pistes, pour le nombre de pistes et la durée ; facultatif pour l'instant */
  tracks?: readonly Track[]
}

/**
 * Fiche d'identité de la release, sur le modèle de ArtistFacts : seules les
 * informations connues sont affichées.
 */
export function ReleaseFacts({ release, tracks }: ReleaseFactsProps) {
  const discs = tracks ? new Set(tracks.map((t) => t.discNumber)).size : 0

  const facts = [
    { label: "Type", value: releaseTypeLabel(release.type) },
    { label: "Released", value: formatPartialDate(release.releaseDate) },
    {
      label: "Tracks",
      value: tracks && tracks.length > 0 ? String(tracks.length) : null,
    },
    {
      label: "Length",
      value: tracks
        ? formatDuration(totalDuration(tracks.map((t) => t.durationMs)))
        : null,
    },
    // un seul disque : l'information n'apporte rien
    { label: "Discs", value: discs > 1 ? String(discs) : null },
  ].filter((fact) => fact.value !== null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Details</h2>
        </CardTitle>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <a
                href={`https://musicbrainz.org/release/${release.mbid}`}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            MusicBrainz
            <ExternalLinkIcon data-icon="inline-end" />
            <span className="sr-only">(opens in a new tab)</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-base font-medium">{value}</dd>
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-4">
            <dt className="text-sm text-muted-foreground">MBID</dt>
            <dd className="mt-1 font-mono text-xs break-all sm:text-sm">
              {release.mbid}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
