import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"

import { findByMbid } from "@/lib/data/releases"
import { ReleaseHeader } from "@/components/releases/release-header"
import { ReleaseFacts } from "@/components/releases/release-facts"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { isMbid } from "@/lib/mbid"
import type { Release } from "@/lib/types"

type ReleasePageProps = {
    params: Promise<{ mbid: string }>
}

// `cache` (React) : generateMetadata et la page demandent la même release ;
// la fonction n'est exécutée qu'une fois par requête, donc une seule lecture
// en base.
const getRelease = cache(async (mbid: string): Promise<Release | null> => {
  if (!isMbid(mbid)) return null

  return findByMbid(mbid)
})

export async function generateMetadata({
    params,
}: ReleasePageProps): Promise<Metadata> {
    const { mbid } = await params
    const release = await getRelease(mbid)

    if (!release) return {}

    return {
        title: release.title,
        description: `${release.title} on Music Graph.`,
    }
}

export default async function ReleasePage({ params }: ReleasePageProps) {
    const { mbid } = await params
    const release = await getRelease(mbid)

    if (!release) notFound()

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link href="/releases" />}>
                            Releases
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{release.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <ReleaseHeader release={release} />
            <ReleaseFacts release={release} />
        </div>
    )
}