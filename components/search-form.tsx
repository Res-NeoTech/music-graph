import { SearchIcon } from "lucide-react"
import Form from "next/form"

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

type SearchFormProps = {
  /** Valeur initiale, ex. le `q` courant sur la page de résultats. */
  defaultValue?: string
  className?: string
}

/**
 * B2 - Fonctionne sans TypeScript côté client (soumission). Améliorer plus tard pour faire la recherche dynamique.
 */
export function SearchForm({ defaultValue, className }: SearchFormProps) {
  return (
    <Form action="/search" role="search" className={cn("w-full", className)}>
      <InputGroup className="h-12 bg-background shadow-md ring-1 ring-foreground/10 dark:bg-card">
        <InputGroupInput
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Search an artist, album or track..."
          aria-label="Search an artist, album or track"
          autoComplete="off"
          enterKeyHint="search"
          maxLength={200}
          required
          className="text-base"
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end" className="pr-1.5">
          <InputGroupButton type="submit" variant="default" size="sm">
            Search
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Form>
  )
}
