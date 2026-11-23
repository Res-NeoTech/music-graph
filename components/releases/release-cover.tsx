"use client"

import { Disc3Icon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { type CoverSize, coverArtUrl } from "@/lib/cover-art"
import type { Release } from "@/lib/types"
import { cn } from "@/lib/utils"

type ReleaseCoverProps = {
  release: Pick<Release, "mbid" | "hasCoverArt">
  size?: CoverSize
  className?: string
}

/**
 * Pochette carrée d'une release, ou à défaut une icône de disque.
 *
 * Composant client à cause de `onError` : `has_cover_art` vient de
 * MusicBrainz au moment de l'import, et l'image peut manquer ou avoir été
 * retirée depuis. On revient alors à l'icône au lieu d'une image cassée.
 * L'image est décorative (alt vide) : le titre est affiché à côté.
 */
export function ReleaseCover({
  release,
  size = 250,
  className,
}: ReleaseCoverProps) {
  const [failed, setFailed] = useState(false)
  const shape = cn("aspect-square w-full", className)

  if (release.hasCoverArt && !failed) {
    return (
      <Image
        unoptimized
        src={coverArtUrl(release.mbid, size)}
        alt=""
        width={size}
        height={size}
        draggable={false}
        onError={() => setFailed(true)}
        className={cn("bg-muted object-cover", shape)}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary-foreground [&>svg]:size-1/4",
        shape
      )}
    >
      <Disc3Icon />
    </span>
  )
}
