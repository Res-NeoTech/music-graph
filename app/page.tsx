import { ArrowRightIcon, NetworkIcon, RouteIcon, SearchIcon } from "lucide-react"
import Link from "next/link"

import MagicRings from "@/components/landing/magic-rings"
import { SearchForm } from "@/components/search-form"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const steps = [
  {
    icon: SearchIcon,
    title: "Search",
    description:
      "Look up any artist, album or track in the catalogue and open its page.",
  },
  {
    icon: NetworkIcon,
    title: "Explore",
    description:
      "See who an artist played, produced or collaborated with, one or two levels deep, and hop from node to node.",
  },
  {
    icon: RouteIcon,
    title: "Connect",
    description:
      "Pick two artists and find the shortest chain of collaborations between them, up to four steps apart.",
  },
]

export default function HomePage() {
  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="relative isolate overflow-hidden border-b"
      >
        <div className="absolute inset-0 -z-10 size-full">
          <MagicRings
            color="#a50036"
            colorTwo="#ffa1ad"
            motion="pulse"
            ringCount={7}
            speed={1}
            lineThickness={5}
            glow={1}
            hoverScale={1}
            clickBurst={false}
            baseRadius={0.35}
            radiusStep={0.13}
            expansion={0.1}
            taper={1.5}
            rotation={0}
            spin={0}
            tilt={0}
            dispersion={0}
            grain={0}
            opacity={1}
            followMouse={false}
            mouseInfluence={0.2}
            hoverIntensity={0}
            parallax={0}
            intro
          />
        </div>

        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
          <p className="mb-6 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            Artists, albums and credits from MusicBrainz
          </p>

          <h1
            id="hero-title"
            className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
          >
            Who played with <span className="text-primary">whom</span>?
          </h1>

          <p className="mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
            Music Graph maps the links between artists: who performed, produced
            or collaborated with whom, and how any two of them are connected.
          </p>

          <SearchForm className="mt-10 max-w-xl" />

          <Link
            href="/path"
            className="group mt-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            Or find the path between two artists
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="how-title"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
      >
        <h2
          id="how-title"
          className="text-center text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          How it works
        </h2>

        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="flex">
              <Card className="w-full">
                <CardHeader className="gap-3">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary-foreground">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span
                      aria-hidden
                      className="font-mono text-sm text-muted-foreground"
                    >
                      0{index + 1}
                    </span>
                  </div>
                  <CardTitle>
                    <h3>{title}</h3>
                  </CardTitle>
                  <CardDescription className="leading-relaxed">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
