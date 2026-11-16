// Réponses JSON brutes des API Wikimedia (format=json&formatversion=2).
// Comme pour MusicBrainz, seuls les champs lus par l'import sont décrits.
// Exemples réels (réduits) : tests/fixtures/wikimedia/

/** Erreur MediaWiki : renvoyée avec un statut HTTP 200. */
export interface WmApiError {
  error?: { code: string; info: string }
}

/** Une déclaration Wikidata (ici : une valeur de la propriété P18 « image »). */
export interface WdStatement {
  mainsnak: {
    /** "value", ou "novalue" / "somevalue" (pas de valeur utilisable) */
    snaktype: string
    /** pour P18 : nom du fichier sur Commons, avec des espaces */
    datavalue?: { value: string; type: string }
  }
  /** "preferred" > "normal" ; "deprecated" = valeur jugée fausse ou obsolète */
  rank: "preferred" | "normal" | "deprecated"
}

/** GET wikidata.org/w/api.php?action=wbgetclaims&entity=Q…&property=P18 */
export interface WdClaimsResponse extends WmApiError {
  /** propriété absente si l'élément n'a pas d'image */
  claims?: { P18?: WdStatement[] }
}

/** Champ de extmetadata : la valeur peut contenir du HTML (liens, <bdi>). */
export interface WmMetadataField {
  value: string
}

/**
 * GET commons.wikimedia.org/w/api.php?action=query&titles=File:…
 *   &prop=imageinfo&iiprop=extmetadata
 */
export interface CommonsImageInfoResponse extends WmApiError {
  query?: {
    pages: {
      title: string
      /** true si le fichier n'existe pas (ou plus) sur Commons */
      missing?: boolean
      imageinfo?: {
        extmetadata?: {
          /** auteur, en HTML */
          Artist?: WmMetadataField
          /** "CC BY-SA 4.0", "Public domain"… */
          LicenseShortName?: WmMetadataField
        }
      }[]
    }[]
  }
}

/**
 * GET wikidata.org/w/api.php?action=wbgetentities&ids=Q…&props=info&redirects=yes
 * Clé = identifiant demandé ; `id` = identifiant de l'élément après redirection.
 */
export interface WdEntitiesResponse extends WmApiError {
  entities?: Record<
    string,
    { id: string; redirects?: { from: string; to: string } }
  >
}
