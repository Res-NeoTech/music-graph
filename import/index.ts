import { parseArgs } from "node:util"

import { db as arango } from "@/lib/db/arango/client"
import { db as postgres } from "@/lib/db/postgres/client"
import { isMbid } from "@/lib/mbid"
import pkg from "@/package.json"

import { CORPUS, type ImportMode, selectArtistsToImport } from "./corpus"
import { ensureGraphSchema, saveGraph } from "./load/arango"
import {
  finishArtistImport,
  loadImportStatuses,
  loadRoleCodes,
  saveMemberships,
  saveRelease,
  startArtistImport,
} from "./load/postgres"
import { buildUserAgent, MusicBrainzClient } from "./musicbrainz/client"
import { toArtistRow } from "./transform/artist"
import { artistToGraph, releaseToGraph } from "./transform/graph"
import { membershipArtists, toMemberships } from "./transform/memberships"
import { transformRelease } from "./transform/release"
import { IMPORTED_RELEASE_TYPES, pickReleases } from "./transform/releases"

const HELP = `Import du corpus MusicBrainz dans PostgreSQL et ArangoDB.

  npm run import                     tout le corpus (import/corpus.ts)
  npm run import -- --failed         seulement les artistes pas encore importés
                                     avec succès (échec, interruption)
  npm run import -- --artist <mbid>  un artiste précis (option répétable)

Débit limité à une requête par seconde : compter environ 30 s par artiste.
Ctrl+C est sans risque : relancer ensuite avec --failed.`

interface ImportContext {
  mb: MusicBrainzClient
  roles: ReadonlySet<string>
}

async function main() {
  const { values: args } = parseArgs({
    options: {
      failed: { type: "boolean", default: false },
      artist: { type: "string", multiple: true },
      help: { type: "boolean", short: "h", default: false },
    },
  })
  if (args.help) {
    console.log(HELP)
    return
  }

  const requested = args.artist ?? CORPUS.map((artist) => artist.mbid)
  const invalid = requested.filter((mbid) => !isMbid(mbid))
  if (invalid.length > 0)
    throw new Error(`MBID invalides : ${invalid.join(", ")}`)
  if (requested.length === 0) {
    console.log(
      "Corpus vide : compléter import/corpus.ts, ou utiliser --artist <mbid>."
    )
    return
  }

  const mode: ImportMode = args.failed ? "failed" : "all"
  const statuses = await loadImportStatuses(postgres, requested)
  const todo = selectArtistsToImport(requested, statuses, mode)
  if (todo.length === 0) {
    console.log("Rien à importer : tout est déjà « ok ».")
    return
  }

  const roles = await loadRoleCodes(postgres)
  if (roles.size === 0) {
    throw new Error(
      "La table roles est vide : lancer d'abord `npm run migrate`."
    )
  }
  await ensureGraphSchema(arango)

  const context: ImportContext = {
    mb: new MusicBrainzClient({
      userAgent: buildUserAgent(pkg.version, process.env.MUSICBRAINZ_CONTACT),
    }),
    roles,
  }

  const failed: string[] = []
  for (const [index, mbid] of todo.entries()) {
    const progress = `[${index + 1}/${todo.length}]`
    try {
      await importArtist(context, mbid, progress)
    } catch (error) {
      failed.push(mbid)
      const message = error instanceof Error ? error.message : String(error)
      console.error(`${progress} ÉCHEC ${mbid} : ${message}`)
      await finishArtistImport(postgres, mbid, error)
    }
  }

  console.log(
    `\nTerminé : ${todo.length - failed.length} artiste(s) importé(s), ${failed.length} échec(s).`
  )
  if (failed.length > 0) {
    console.log("Relancer seulement les échecs : npm run import -- --failed")
    process.exitCode = 1
  }
}

/**
 * Import complet d'un artiste du corpus :
 * 1. l'artiste et ses membres / groupes ;
 * 2. une édition de chacun de ses albums et EP, avec morceaux et crédits.
 * PostgreSQL et ArangoDB sont écrits au fur et à mesure ; tout est
 * idempotent, donc un artiste interrompu peut être réimporté en entier.
 */
async function importArtist(
  { mb, roles }: ImportContext,
  mbid: string,
  progress: string
) {
  const mbArtist = await mb.getArtist(mbid)
  const artist = toArtistRow(mbArtist)
  console.log(`${progress} ${artist.name} (${mbid})`)
  await startArtistImport(postgres, artist)

  const related = membershipArtists(mbArtist)
  const memberships = toMemberships(mbArtist)
  await saveMemberships(postgres, related, memberships)
  await saveGraph(arango, artistToGraph(artist, related, memberships))

  const editions = pickReleases(
    await mb.browseReleases(mbid, IMPORTED_RELEASE_TYPES)
  )
  for (const [index, edition] of editions.entries()) {
    const data = transformRelease(await mb.getRelease(edition.id), { roles })
    await saveRelease(postgres, data)
    await saveGraph(arango, releaseToGraph(data))
    console.log(
      `    ${index + 1}/${editions.length} ${data.release.title} ` +
        `(${data.release.releaseDate ?? "date inconnue"}) : ` +
        `${data.tracks.length} pistes, ${data.credits.length} crédits`
    )
  }

  await finishArtistImport(postgres, mbid)
}

main()
  .catch((error: unknown) => {
    // Seulement le message et la pile : l'objet d'erreur complet d'arangojs
    // contient la requête HTTP, avec l'identifiant (en-tête Authorization).
    console.error(error instanceof Error ? error.stack : String(error))
    process.exitCode = 1
  })
  .finally(async () => {
    // fermer les connexions, sinon Node ne s'arrête pas
    await postgres.$client.end()
    arango.close()
  })
