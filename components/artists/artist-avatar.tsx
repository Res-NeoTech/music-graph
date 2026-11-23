"use client"

import Image from "next/image"
import { useState } from "react"

import { ArtistTypeIcon } from "@/components/artists/artist-type"
import { commonsThumbnailUrl } from "@/lib/artist-image"
import type { ArtistImage, ArtistType } from "@/lib/types"
import { cn } from "@/lib/utils"

type ArtistAvatarProps = {
  type: ArtistType | null
  image: ArtistImage | null
  size?: "default" | "lg"
  className?: string
}

const SIZES = {
  default: { px: 40, shape: "size-10 rounded-2xl", icon: "[&>svg]:size-5" },
  lg: {
    px: 80,
    shape: "size-16 rounded-3xl sm:size-20",
    icon: "[&>svg]:size-8 sm:[&>svg]:size-10",
  },
}

/**
 * Photo de l'artiste (Wikimedia Commons), ou à défaut une pastille avec
 * l'icône de son type, dans la couleur de la marque.
 *
 * Composant client à cause de `onError` : si le fichier a disparu de Commons
 * depuis l'import, on revient à la pastille au lieu d'une image cassée.
 * L'image est décorative (alt vide) : le nom de l'artiste est juste à côté.
 */
export function ArtistAvatar({
  type,
  image,
  size = "default",
  className,
}: ArtistAvatarProps) {
  const [failed, setFailed] = useState(false)
  const { px, shape, icon } = SIZES[size]

  if (image && !failed) {
    return (
      <Image
        // unoptimized : Wikimedia renvoie déjà une vignette redimensionnée, et
        // le navigateur la charge directement. Le serveur Next.js ne contacte
        // donc aucun service externe (il lit seulement PostgreSQL et ArangoDB).
        unoptimized
        src={commonsThumbnailUrl(image.file)}
        alt=""
        width={px}
        height={px}
        draggable={false}
        onError={() => setFailed(true)}
        className={cn(
          "shrink-0 bg-muted object-cover object-top",
          shape,
          className
        )}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary-foreground",
        shape,
        icon,
        className
      )}
    >
      <ArtistTypeIcon type={type} />
    </span>
  )
}
