import type { artistType } from "../postgres/schema"

// Noms des collections ArangoDB et forme des documents.
// Partagé entre le script d'import (seul écrivain) et lib/data/ (lectures AQL).

export const COLLECTIONS = {
  ARTISTS: "artists",
  RELEASES: "releases",
  RECORDINGS: "recordings",

  CREDITED_ARTISTS: "credited_artists",
  MEMBER_OF: "member_of",
  CONTAINS: "contains",
} as const

// Graphe nommé : permet d'écrire `GRAPH "music_graph"` en AQL
// et d'afficher le graphe dans l'interface web d'ArangoDB.
export const GRAPH_NAME = "music_graph"

// ---------------------------------------------------------------- sommets
// _key = MBID. Seulement ce qu'il faut pour dessiner le graphe :
// le détail (dates, pays, tracklist…) est lu dans PostgreSQL.

export interface ArtistVertex {
  _key: string
  name: string
  type?: (typeof artistType.enumValues)[number]
}

export interface ReleaseVertex {
  _key: string
  title: string
}

export interface RecordingVertex {
  _key: string
  title: string
}

// ----------------------------------------------------------------- arêtes
// _from / _to = "collection/_key". La _key d'une arête est calculée à partir
// de ses extrémités (et du rôle) : réimporter la même arête la remplace au
// lieu de créer un doublon.

export interface CreditedEdge {
  _key: string
  _from: string
  _to: string
  // roles.code dans PostgreSQL ("producer", "vocal"…),
  // ou "main" / "featuring" pour le crédit d'artiste du morceau
  role: string
}

export interface MemberOfEdge {
  _key: string
  _from: string
  _to: string
}

export interface ContainsEdge {
  _key: string
  _from: string
  _to: string
}
