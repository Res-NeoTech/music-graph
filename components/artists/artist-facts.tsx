import { ExternalLinkIcon } from "lucide-react"

import { artistTypeLabel } from "@/components/artists/artist-type"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { countryName, formatPartialDate, lifeSpanLabels } from "@/lib/format"
import type { Artist } from "@/lib/types"

/**
 * Fiche d'identité de l'artiste. Seules les informations connues sont
 * affichées : une ligne vide n'apporte rien, et beaucoup d'artistes hors
 * corpus n'ont que leur nom et leur MBID.
 */
export function ArtistFacts({ artist }: { artist: Artist }) {
  const labels = lifeSpanLabels(artist.type)

  const facts = [
    { label: "Type", value: artistTypeLabel(artist.type) },
    { label: "Country", value: countryName(artist.country) },
    { label: labels.start, value: formatPartialDate(artist.startDate) },
    { label: labels.finish, value: formatPartialDate(artist.finishDate) },
    {
      // utile seulement s'il diffère du nom ("Lamar, Kendrick")
      label: "Sort name",
      value: artist.sortingName !== artist.name ? artist.sortingName : null,
    },
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
                href={`https://musicbrainz.org/artist/${artist.mbid}`}
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
              {artist.mbid}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
