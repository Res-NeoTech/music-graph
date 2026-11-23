import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDuration } from "@/lib/format"
import type { Track } from "@/lib/types"

/** Pistes regroupées par disque, chaque disque trié par position. */
export function groupByDisc(tracks: readonly Track[]): [number, Track[]][] {
  const discs = new Map<number, Track[]>()
  for (const track of tracks) {
    const disc = discs.get(track.discNumber) ?? []
    disc.push(track)
    discs.set(track.discNumber, disc)
  }
  return [...discs.entries()]
    .sort(([a], [b]) => a - b)
    .map(([disc, list]) => [disc, list.sort((a, b) => a.position - b.position)])
}

/**
 * Liste des pistes d'une release. Le titre mène à la page du morceau
 * (recording), où se trouvent ses crédits. L'intitulé « Disc n » n'apparaît
 * que s'il y a plusieurs disques.
 */
export function Tracklist({ tracks }: { tracks: readonly Track[] }) {
  const discs = groupByDisc(tracks)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Tracklist</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {discs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No tracks listed for this release.
          </p>
        )}
        {discs.map(([disc, discTracks]) => (
          <section key={disc} aria-label={`Disc ${disc}`}>
            {discs.length > 1 && (
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Disc {disc}
              </h3>
            )}
            <ol className="divide-y">
              {discTracks.map((track) => (
                <TrackRow key={track.mbid} track={track} />
              ))}
            </ol>
          </section>
        ))}
      </CardContent>
    </Card>
  )
}

function TrackRow({ track }: { track: Track }) {
  const duration = formatDuration(track.durationMs)

  return (
    <li className="flex items-baseline gap-4 py-2.5">
      <span className="w-6 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
        {track.position}
      </span>
      <Link
        href={`/recordings/${track.recordingMbid}`}
        className="min-w-0 flex-1 font-medium wrap-break-word underline-offset-4 hover:underline"
      >
        {track.title}
      </Link>
      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
        {duration ?? "–"}
      </span>
    </li>
  )
}
