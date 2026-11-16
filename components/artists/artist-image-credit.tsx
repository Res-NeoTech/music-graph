import { commonsFilePageUrl } from "@/lib/artist-image"
import type { ArtistImage } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Crédit de la photo : les licences CC BY et CC BY-SA exigent l'auteur, la
 * licence et un lien vers la source. Le lien mène à la page du fichier sur
 * Commons, qui donne le texte complet de la licence.
 */
export function ArtistImageCredit({
  image,
  className,
}: {
  image: ArtistImage
  className?: string
}) {
  const parts = [image.author, image.licence].filter(Boolean)

  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Photo
      {parts.length > 0 && <>: {parts.join(" · ")}</>} ·{" "}
      <a
        href={commonsFilePageUrl(image.file)}
        target="_blank"
        rel="noreferrer"
        className="underline-offset-4 hover:underline"
      >
        Wikimedia Commons
      </a>
    </p>
  )
}
