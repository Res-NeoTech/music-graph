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

// Un seul endroit associe chaque type d'artiste à son libellé et à son icône :
// l'avatar, la carte, l'en-tête et le badge restent ainsi cohérents.
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

/** Icône du type d'artiste (icône neutre si le type est inconnu). */
export function ArtistTypeIcon({ type }: { type: ArtistType | null }) {
  const Icon = type ? ARTIST_TYPES[type].icon : UNKNOWN_TYPE_ICON
  return <Icon />
}

export function ArtistTypeBadge({ type }: { type: ArtistType | null }) {
  const label = artistTypeLabel(type)
  if (!label) return null

  return <Badge variant="secondary">{label}</Badge>
}
