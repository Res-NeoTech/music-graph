import { ReleaseCard } from "./release-card"
import type { Release } from "@/lib/types"

/** Grille de cartes : 1 colonne sur mobile, 2 sur tablette, 3 sur écran large. */
export function ReleaseGrid({ releases }: { releases: Release[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {releases.map((release) => (
        <li key={release.mbid} className="flex">
          <ReleaseCard release={release} />
        </li>
      ))}
    </ul>
  )
}
