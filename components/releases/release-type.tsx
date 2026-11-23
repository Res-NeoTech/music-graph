import { Badge } from "@/components/ui/badge"
import type { ReleaseType } from "@/lib/types"

const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
  broadcast: "Broadcast",
  other: "Other",
}

export function releaseTypeLabel(type: ReleaseType | null): string | null {
  return type ? RELEASE_TYPE_LABELS[type] : null
}

export function ReleaseTypeBadge({ type }: { type: ReleaseType | null }) {
  const label = releaseTypeLabel(type)
  if (!label) return null

  return <Badge variant="secondary">{label}</Badge>
}
