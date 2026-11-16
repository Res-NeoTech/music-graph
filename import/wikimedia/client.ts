import { setTimeout as delay } from "node:timers/promises"

import type {
  CommonsImageInfoResponse,
  WdClaimsResponse,
  WdEntitiesResponse,
} from "./types"

// Appels aux API Wikidata et Wikimedia Commons, pour la photo des artistes.
// Utilisé seulement par le script d'import, comme le client MusicBrainz.
// Règles (https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy) :
//  - un User-Agent qui identifie l'application et donne un contact ;
//  - pas de requêtes en parallèle ;
//  - 429 / 503 = trop de requêtes ou serveur surchargé : attendre, réessayer.
// Pas de limite fixe d'une requête par seconde comme MusicBrainz : les deux
// requêtes par artiste sont de toute façon séparées par les appels MusicBrainz.

const WIKIDATA_API = "https://www.wikidata.org/w/api.php"
const COMMONS_API = "https://commons.wikimedia.org/w/api.php"

/** Identifiant d'un élément Wikidata : Q suivi d'un nombre. */
const WIKIDATA_ID = /^Q[1-9][0-9]*$/

export interface WikimediaClientOptions {
  /** même format que pour MusicBrainz : voir buildUserAgent() */
  userAgent: string
  /** nouvelles tentatives après un 429 ou un 503 (défaut : 2) */
  maxRetries?: number
  /** attente avant la 1re nouvelle tentative, doublée ensuite, si pas de Retry-After (défaut : 2000 ms) */
  retryDelayMs?: number
  /** abandon d'une requête sans réponse (défaut : 15 s) */
  timeoutMs?: number
  // Remplacés par des faux dans les tests
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<unknown>
}

/** Erreur HTTP, ou erreur renvoyée par l'API MediaWiki (avec un statut 200). */
export class WikimediaError extends Error {
  readonly status: number
  readonly url: string
  /** code d'erreur MediaWiki ("no-such-entity"…), absent pour une erreur HTTP */
  readonly code?: string

  constructor(status: number, url: string, detail = "", code?: string) {
    super(`Wikimedia a répondu ${status} ${detail} pour ${url}`.trim())
    this.name = "WikimediaError"
    this.status = status
    this.url = url
    this.code = code
  }
}

export class WikimediaClient {
  private readonly userAgent: string
  private readonly maxRetries: number
  private readonly retryDelayMs: number
  private readonly timeoutMs: number
  private readonly fetch: typeof fetch
  private readonly sleep: (ms: number) => Promise<unknown>

  constructor(options: WikimediaClientOptions) {
    this.userAgent = options.userAgent
    this.maxRetries = options.maxRetries ?? 2
    this.retryDelayMs = options.retryDelayMs ?? 2000
    this.timeoutMs = options.timeoutMs ?? 15_000
    this.fetch = options.fetch ?? ((input, init) => fetch(input, init))
    this.sleep = options.sleep ?? delay
  }

  /**
   * Valeurs de la propriété P18 (« image ») d'un élément Wikidata.
   * wbgetclaims ne renvoie que cette propriété, pas tout l'élément (plusieurs
   * centaines de Ko pour un artiste connu).
   *
   * Si l'élément a été fusionné dans un autre (doublon), MusicBrainz peut
   * encore pointer vers l'ancien : wbgetclaims ne suit pas cette redirection,
   * on cherche donc l'élément cible et on redemande, une seule fois.
   */
  async getImageClaims(wikidataId: string): Promise<WdClaimsResponse> {
    try {
      return await this.getClaims(wikidataId)
    } catch (error) {
      if (!(error instanceof WikimediaError)) throw error
      if (error.code !== "unresolved-redirect") throw error
      return this.getClaims(await this.resolveRedirect(wikidataId))
    }
  }

  private async getClaims(wikidataId: string): Promise<WdClaimsResponse> {
    checkWikidataId(wikidataId)
    return this.get(WIKIDATA_API, {
      action: "wbgetclaims",
      entity: wikidataId,
      property: "P18",
    })
  }

  /** Identifiant de l'élément vers lequel redirige un élément fusionné. */
  private async resolveRedirect(wikidataId: string): Promise<string> {
    const data = await this.get<WdEntitiesResponse>(WIKIDATA_API, {
      action: "wbgetentities",
      ids: wikidataId,
      props: "info",
      redirects: "yes",
    })
    const target = data.entities?.[wikidataId]?.id
    if (!target || target === wikidataId) {
      throw new Error(`Redirection Wikidata introuvable pour ${wikidataId}`)
    }
    return target
  }

  /** Auteur et licence d'un fichier de Wikimedia Commons. */
  async getFileInfo(fileName: string): Promise<CommonsImageInfoResponse> {
    return this.get(COMMONS_API, {
      action: "query",
      titles: `File:${fileName}`,
      prop: "imageinfo",
      iiprop: "extmetadata",
      // seulement les champs utiles : la réponse complète est bien plus longue
      iiextmetadatafilter: "Artist|LicenseShortName",
    })
  }

  private async get<T extends { error?: { code: string; info: string } }>(
    endpoint: string,
    params: Record<string, string>
  ): Promise<T> {
    const url = new URL(endpoint)
    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(name, value)
    }
    url.searchParams.set("format", "json")
    url.searchParams.set("formatversion", "2")

    for (let retry = 0; ; retry++) {
      const response = await this.fetch(url, {
        headers: { "User-Agent": this.userAgent, Accept: "application/json" },
        signal: AbortSignal.timeout(this.timeoutMs),
      })

      if (response.ok) {
        const data = (await response.json()) as T
        // MediaWiki signale ses erreurs dans le corps, avec un statut 200
        if (data.error) {
          throw new WikimediaError(
            response.status,
            url.href,
            data.error.code,
            data.error.code
          )
        }
        return data
      }

      await response.body?.cancel()
      const retryable = response.status === 429 || response.status === 503
      if (retryable && retry < this.maxRetries) {
        const retryAfter = Number(response.headers.get("Retry-After"))
        await this.sleep(
          retryAfter > 0 ? retryAfter * 1000 : this.retryDelayMs * 2 ** retry
        )
        continue
      }
      throw new WikimediaError(response.status, url.href, response.statusText)
    }
  }
}

/** Refuse un identifiant mal formé avant de l'insérer dans une URL. */
function checkWikidataId(wikidataId: string) {
  if (!WIKIDATA_ID.test(wikidataId)) {
    throw new Error(`Identifiant Wikidata invalide : « ${wikidataId} »`)
  }
}
