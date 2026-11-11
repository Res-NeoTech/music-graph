import { setTimeout as delay } from "node:timers/promises"

import { isMbid } from "@/lib/mbid"

import type {
  MbArtist,
  MbBrowseRelease,
  MbRelease,
  MbReleaseBrowse,
} from "./types"

// SEUL appelant de l'API MusicBrainz du projet.
// Règles de l'API (https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting) :
//  - une requête par seconde au maximum ;
//  - un User-Agent qui identifie l'application et donne un contact ;
//  - 503 = débit dépassé : attendre, puis réessayer.

const DEFAULT_BASE_URL = "https://musicbrainz.org/ws/2/"

/** Maximum autorisé par l'API pour une page de browse. */
const PAGE_SIZE = 100

/** Ce que l'on demande en plus de la release elle-même (paramètre inc). */
const RELEASE_INCLUDES = [
  "artist-credits", // « Kanye West feat. Kid Cudi & Raekwon » : release et morceaux
  "recordings", // tracklist
  "release-groups", // type (album, EP) et MBID de l'album
  "artist-rels", // relations vers des artistes…
  "recording-level-rels", // …y compris celles de chaque morceau (musiciens, producteurs)
  "work-rels", // morceau → œuvre
  "work-level-rels", // œuvre → compositeurs, paroliers
]

export interface MusicBrainzClientOptions {
  /** voir buildUserAgent() */
  userAgent: string
  baseUrl?: string
  /** délai minimal entre le début de deux requêtes (défaut : 1000 ms) */
  minIntervalMs?: number
  /** nombre de nouvelles tentatives après un 503 (défaut : 4) */
  maxRetries?: number
  /** attente avant la 1re nouvelle tentative, doublée ensuite, si pas de Retry-After (défaut : 2000 ms) */
  retryDelayMs?: number
  /** abandon d'une requête sans réponse (défaut : 30 s) */
  timeoutMs?: number
  // Remplacés par des faux dans les tests (pas de réseau, pas d'attente réelle)
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<unknown>
  now?: () => number
}

/** Réponse HTTP en erreur (404, 503 après toutes les tentatives…). */
export class MusicBrainzError extends Error {
  readonly status: number
  readonly url: string

  constructor(status: number, url: string, statusText = "") {
    super(`MusicBrainz a répondu ${status} ${statusText} pour ${url}`.trim())
    this.name = "MusicBrainzError"
    this.status = status
    this.url = url
  }
}

/** Format exigé : « MusicGraph/0.0.1 ( contact ) » */
export function buildUserAgent(version: string, contact: string | undefined) {
  if (!contact?.trim()) {
    throw new Error(
      "MUSICBRAINZ_CONTACT manquant dans .env : MusicBrainz exige un contact " +
        "(e-mail ou URL) dans le User-Agent. Voir .env.example."
    )
  }
  return `MusicGraph Agent/${version} ( ${contact.trim()} )`
}

/** Résultat d'un seul appel HTTP, le corps déjà lu. */
type Attempt =
  | { ok: true; data: unknown }
  | { ok: false; status: number; statusText: string; retryAfterMs?: number }

export class MusicBrainzClient {
  private readonly userAgent: string
  private readonly baseUrl: string
  private readonly minIntervalMs: number
  private readonly maxRetries: number
  private readonly retryDelayMs: number
  private readonly timeoutMs: number
  private readonly fetch: typeof fetch
  private readonly sleep: (ms: number) => Promise<unknown>
  private readonly now: () => number

  /** File d'attente : chaque requête attend la fin de la précédente. */
  private queue: Promise<unknown> = Promise.resolve()
  private lastRequestAt = Number.NEGATIVE_INFINITY

  constructor(options: MusicBrainzClientOptions) {
    this.userAgent = options.userAgent
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL
    this.minIntervalMs = options.minIntervalMs ?? 1000
    this.maxRetries = options.maxRetries ?? 4
    this.retryDelayMs = options.retryDelayMs ?? 2000
    this.timeoutMs = options.timeoutMs ?? 30_000
    // fonction fléchée : fetch ne doit pas être appelé avec `this` = le client
    this.fetch = options.fetch ?? ((input, init) => fetch(input, init))
    this.sleep = options.sleep ?? delay
    this.now = options.now ?? Date.now
  }

  // `async` : une erreur (MBID invalide) devient une promesse rejetée,
  // comme les erreurs réseau, au lieu d'une exception synchrone.

  /** Artiste et ses relations vers d'autres artistes (membres, groupes). */
  async getArtist(mbid: string): Promise<MbArtist> {
    return this.get(`artist/${checkMbid(mbid)}`, { inc: "artist-rels" })
  }

  /** Release avec tracklist, crédits d'artiste et relations des morceaux. */
  async getRelease(mbid: string): Promise<MbRelease> {
    return this.get(`release/${checkMbid(mbid)}`, {
      inc: RELEASE_INCLUDES.join(" "),
    })
  }

  /**
   * Toutes les releases officielles signées par un artiste, dont l'album est
   * d'un des types demandés (ex. ["album", "ep"]). Parcourt toutes les pages.
   */
  async browseReleases(
    artistMbid: string,
    types: readonly string[]
  ): Promise<MbBrowseRelease[]> {
    const releases: MbBrowseRelease[] = []
    let total = Number.POSITIVE_INFINITY

    while (releases.length < total) {
      const page = await this.get<MbReleaseBrowse>("release", {
        artist: checkMbid(artistMbid),
        type: types.join("|"),
        status: "official",
        inc: "release-groups",
        limit: String(PAGE_SIZE),
        offset: String(releases.length),
      })
      total = page["release-count"]
      // page vide : sécurité contre une boucle infinie si le total est faux
      if (page.releases.length === 0) break
      releases.push(...page.releases)
    }
    return releases
  }

  /** GET JSON, avec limite de débit et nouvelles tentatives après un 503. */
  private async get<T>(path: string, params: Record<string, string>) {
    const url = new URL(path, this.baseUrl)
    for (const [name, value] of Object.entries(params)) {
      // URLSearchParams encode l'espace en « + » : inc=artist-rels+recordings
      url.searchParams.set(name, value)
    }
    url.searchParams.set("fmt", "json")

    for (let retry = 0; ; retry++) {
      const attempt = await this.throttled(() => this.send(url))
      if (attempt.ok) return attempt.data as T

      if (attempt.status === 503 && retry < this.maxRetries) {
        await this.sleep(attempt.retryAfterMs ?? this.retryDelayMs * 2 ** retry)
        continue
      }
      throw new MusicBrainzError(attempt.status, url.href, attempt.statusText)
    }
  }

  /** Un appel HTTP. Le corps est lu ici, avant de libérer la file d'attente. */
  private async send(url: URL): Promise<Attempt> {
    const response = await this.fetch(url, {
      headers: { "User-Agent": this.userAgent, Accept: "application/json" },
      signal: AbortSignal.timeout(this.timeoutMs),
    })
    if (response.ok) return { ok: true, data: await response.json() }

    await response.body?.cancel() // corps inutile : libère la connexion
    const retryAfter = Number(response.headers.get("Retry-After"))
    return {
      ok: false,
      status: response.status,
      statusText: response.statusText,
      retryAfterMs: retryAfter > 0 ? retryAfter * 1000 : undefined,
    }
  }

  /**
   * Exécute `task` quand la requête précédente est terminée ET qu'au moins
   * minIntervalMs se sont écoulées depuis son début. Les requêtes passent donc
   * une par une, même si plusieurs appels sont lancés en même temps.
   */
  private throttled<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.lastRequestAt + this.minIntervalMs - this.now()
      if (wait > 0) await this.sleep(wait)
      this.lastRequestAt = this.now()
      return task()
    })
    // une requête en échec ne doit pas bloquer les suivantes
    this.queue = run.catch(() => undefined)
    return run
  }
}

/** Refuse un MBID mal formé avant de l'insérer dans une URL. */
function checkMbid(mbid: string): string {
  if (!isMbid(mbid)) throw new Error(`MBID invalide : « ${mbid} »`)
  return mbid
}
