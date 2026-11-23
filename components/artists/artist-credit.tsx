import Link from "next/link"
import { Fragment } from "react"

import type { ArtistCredit } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Crédit d'artiste tel qu'imprimé : « Kanye West feat. Kid Cudi & Raekwon ».
 * Chaque nom mène à la page de l'artiste (par MBID : deux artistes peuvent
 * porter le même nom), le texte de liaison reste du texte.
 * Réutilisable pour les releases et les morceaux (même structure en base).
 */
export function ArtistCreditLine({
  credits,
  className,
}: {
  credits: readonly ArtistCredit[]
  className?: string
}) {
  if (credits.length === 0) return null

  return (
    <p className={cn("text-pretty", className)}>
      {credits.map((credit) => (
        <Fragment key={credit.artistMbid}>
          <Link
            href={`/artists/${credit.artistMbid}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {credit.creditedName}
          </Link>
          {credit.joinPhrase}
        </Fragment>
      ))}
    </p>
  )
}
