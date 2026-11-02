import { Separator } from "@/components/ui/separator"

const sources = [
  { href: "https://musicbrainz.org", label: "MusicBrainz" },
  { href: "https://coverartarchive.org", label: "Cover Art Archive" },
]

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>&copy; {new Date().getFullYear()} Music Graph · Maksym Ptytsia</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 whitespace-nowrap">
          <span>Data from</span>
          {sources.map(({ href, label }, index) => (
            <div key={href} className="flex h-4 items-center gap-2">
              {index > 0 && <Separator orientation="vertical" />}
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
