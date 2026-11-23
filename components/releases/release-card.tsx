"use client"

import Link from "next/link"

import { ReleaseCover } from "@/components/releases/release-cover"
import { ReleaseTypeBadge } from "@/components/releases/release-type"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { formatPartialDate } from "@/lib/format"
import type { Release } from "@/lib/types"

/**
 * Carte d'une release, cliquable en entier : pochette, titre, type et date
 * de sortie. Le lien utilise le MBID, jamais le titre. Même style que
 * ArtistCard, pour la liste des albums et la page artiste.
 *
 * Composant client parce que la pochette en est un (repli sur une icône si
 * l'image ne se charge pas) ; les données arrivent déjà prêtes en props,
 * lues côté serveur dans lib/data/releases.ts.
 */
export function ReleaseCard({ release }: { release: Release }) {
  const date = formatPartialDate(release.releaseDate)

  return (
    <Link
      href={`/releases/${release.mbid}`}
      className="group flex w-full rounded-4xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <Card
        size="sm"
        className="w-full pt-0 transition-shadow group-hover:shadow-lg group-hover:ring-primary/40 dark:group-hover:ring-primary/60"
      >
        {/* 500 px : la carte fait jusqu'à ~350 px de large sur 3 colonnes */}
        <ReleaseCover release={release} size={500} />
        <CardContent className="flex h-full flex-col gap-2">
          <CardTitle>
            <h2 className="line-clamp-2">{release.title}</h2>
          </CardTitle>
          <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <ReleaseTypeBadge type={release.type} />
            {date && (
              <CardDescription>
                <time dateTime={release.releaseDate ?? undefined}>{date}</time>
              </CardDescription>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
