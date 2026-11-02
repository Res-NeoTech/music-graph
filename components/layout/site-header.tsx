import { RouteIcon, SearchIcon } from "lucide-react"
import Link from "next/link"

import { ThemeToggle } from "@/components/layout/theme-toggle"
import { MusicGraphIcon, MusicGraphLogo } from "@/components/music-graph-logo"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/path", label: "Path", icon: RouteIcon },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Music Graph, home"
          className="mr-auto rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <MusicGraphLogo aria-hidden className="hidden h-7 sm:block" />
          <MusicGraphIcon aria-hidden className="sm:hidden" />
        </Link>

        <nav aria-label="Main">
          <ul className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Button
                  variant="ghost"
                  render={<Link href={href} />}
                  nativeButton={false}
                >
                  <Icon data-icon="inline-start" />
                  {label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  )
}
