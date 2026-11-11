import {
  DramaIcon,
  type LucideIcon,
  MicVocalIcon,
  Music2Icon,
  PianoIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { ArtistType } from "@/lib/types"
import { cn } from "@/lib/utils"

// Un seul endroit associe chaque type d'artiste à son libellé et à son icône :
// la carte, l'en-tête et le badge restent ainsi cohérents.
const ARTIST_TYPES: Record<ArtistType, { label: string; icon: LucideIcon }> = {
  person: { label: "Person", icon: UserIcon },
  group: { label: "Group", icon: UsersIcon },
  orchestra: { label: "Orchestra", icon: PianoIcon },
  choir: { label: "Choir", icon: MicVocalIcon },
  character: { label: "Character", icon: DramaIcon },
  other: { label: "Other", icon: Music2Icon },
}

// Type absent (NULL en base) : icône neutre et pas de badge.
const UNKNOWN_TYPE_ICON = Music2Icon

export function artistTypeLabel(type: ArtistType | null): string | null {
  return type ? ARTIST_TYPES[type].label : null
}

type ArtistAvatarProps = {
  type: ArtistType | null
  size?: "default" | "lg"
  className?: string
}

/**
 * Pastille qui tient lieu de photo : MusicBrainz ne fournit pas d'image
 * d'artiste, on affiche donc l'icône du type dans la couleur de la marque
 * (même pastille que sur la page d'accueil).
 */
export function ArtistAvatar({
  type,
  size = "default",
  className,
}: ArtistAvatarProps) {
  const Icon = type ? ARTIST_TYPES[type].icon : UNKNOWN_TYPE_ICON

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary-foreground",
        size === "lg"
          ? "size-16 rounded-3xl sm:size-20 [&>svg]:size-8 sm:[&>svg]:size-10"
          : "size-10 rounded-2xl [&>svg]:size-5",
        className
      )}
    >
      <Icon />
    </span>
  )
}

export function ArtistTypeBadge({ type }: { type: ArtistType | null }) {
  const label = artistTypeLabel(type)
  if (!label) return null

  return <Badge variant="secondary">{label}</Badge>
}
