import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import { pageWindow } from "@/lib/pagination"
import { cn } from "@/lib/utils"

type PaginationNavProps = {
  /** Page courante, à partir de 1. */
  page: number
  /** Numéro de la dernière page. */
  lastPage: number
  /** Adresse d'une page : chaque écran garde ses propres paramètres (`q`…). */
  hrefForPage: (page: number) => string
  className?: string
}

/**
 * Pagination par liens : aucune logique côté client, chaque numéro est un
 * lien vers `?page=N`.
 *
 * Les liens sont des <Link> de Next.js (navigation sans rechargement,
 * préchargement) habillés avec `buttonVariants`, et non le PaginationLink de
 * shadcn : celui-ci impose un <a> simple (rechargement complet) et lui donne
 * role="button", alors qu'un lecteur d'écran doit annoncer un lien.
 */
export function PaginationNav({
  page,
  lastPage,
  hrefForPage,
  className,
}: PaginationNavProps) {
  // Une seule page : rien à paginer
  if (lastPage <= 1) return null

  return (
    <Pagination className={className}>
      <PaginationContent className="gap-1.5">
        <PaginationItem>
          <StepLink
            direction="previous"
            href={page > 1 ? hrefForPage(page - 1) : null}
          />
        </PaginationItem>

        <PaginationItem className="px-2 text-sm whitespace-nowrap text-muted-foreground sm:hidden">
          Page <span className="font-medium text-foreground">{page}</span> of{" "}
          {lastPage.toLocaleString("en-US")}
        </PaginationItem>

        {pageWindow(page, lastPage).map((item, index) =>
          item === "ellipsis" ? (
            // deux « … » au plus : l'index suffit comme clé
            <PaginationItem key={`ellipsis-${index}`} className="max-sm:hidden">
              <PaginationEllipsis className="text-muted-foreground" />
            </PaginationItem>
          ) : (
            <PaginationItem key={item} className="max-sm:hidden">
              <Link
                href={hrefForPage(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  // page courante dans la couleur de la marque, les autres discrètes
                  buttonVariants({
                    variant: item === page ? "default" : "ghost",
                  }),
                  "min-w-9 px-2.5 tabular-nums"
                )}
              >
                {item}
              </Link>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <StepLink
            direction="next"
            href={page < lastPage ? hrefForPage(page + 1) : null}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

// Sous 360 px, « Previous / Page 5 of 258 / Next » ne tient plus sur une
// ligne : flèche seule, le texte reste lu par les lecteurs d'écran (même
// seuil que dans l'en-tête du site).
const NARROW_SR_ONLY = "max-[359px]:sr-only"

type StepLinkProps = {
  direction: "previous" | "next"
  /** null sur la première ou la dernière page : bouton désactivé, sans lien. */
  href: string | null
}

function StepLink({ direction, href }: StepLinkProps) {
  const isPrevious = direction === "previous"

  const content = isPrevious ? (
    <>
      <ChevronLeftIcon data-icon="inline-start" />
      <span className={NARROW_SR_ONLY}>Previous</span>
    </>
  ) : (
    <>
      <span className={NARROW_SR_ONLY}>Next</span>
      <ChevronRightIcon data-icon="inline-end" />
    </>
  )

  const className = buttonVariants({ variant: "outline" })

  if (href === null) {
    return (
      <span
        aria-disabled="true"
        className={cn(className, "pointer-events-none opacity-50")}
      >
        {content}
      </span>
    )
  }

  return (
    <Link href={href} rel={isPrevious ? "prev" : "next"} className={className}>
      {content}
    </Link>
  )
}
