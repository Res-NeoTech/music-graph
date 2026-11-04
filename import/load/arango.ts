import { aql, type Database } from "arangojs"
import { isArangoError } from "arangojs/errors"

import { COLLECTIONS, GRAPH_NAME } from "@/lib/db/arango/collections"

import type { GraphDocuments } from "../transform/types"

// SEUL écrivain d'ArangoDB du projet. ArangoDB ne contient que le graphe des
// relations ; les données affichées dans les pages sont dans PostgreSQL.

const VERTEX_COLLECTIONS = [
  COLLECTIONS.ARTISTS,
  COLLECTIONS.RELEASES,
  COLLECTIONS.RECORDINGS,
]

/** Pour chaque collection d'arêtes : d'où partent et où arrivent ses arêtes. */
const EDGE_DEFINITIONS = [
  {
    collection: COLLECTIONS.CREDITED_ARTISTS,
    from: [COLLECTIONS.ARTISTS],
    to: [COLLECTIONS.RECORDINGS],
  },
  {
    collection: COLLECTIONS.MEMBER_OF,
    from: [COLLECTIONS.ARTISTS],
    to: [COLLECTIONS.ARTISTS],
  },
  {
    collection: COLLECTIONS.CONTAINS,
    from: [COLLECTIONS.RELEASES],
    to: [COLLECTIONS.RECORDINGS],
  },
]

/**
 * Crée la base, les collections et le graphe nommé s'ils n'existent pas
 * encore. Sans effet sinon : appelée à chaque lancement de l'import.
 */
export async function ensureGraphSchema(db: Database) {
  if (!(await databaseExists(db))) {
    // seule la base _system peut créer une base
    await db.database("_system").createDatabase(db.name)
  }
  for (const name of VERTEX_COLLECTIONS) {
    if (!(await db.collection(name).exists())) await db.createCollection(name)
  }
  for (const { collection } of EDGE_DEFINITIONS) {
    if (!(await db.collection(collection).exists())) {
      await db.createEdgeCollection(collection)
    }
  }
  const graph = db.graph(GRAPH_NAME)
  if (!(await graph.exists())) await graph.create(EDGE_DEFINITIONS)
}

/** db.exists(), avec un message clair si l'identifiant est refusé. */
async function databaseExists(db: Database): Promise<boolean> {
  try {
    return await db.exists()
  } catch (error) {
    if (isArangoError(error) && error.code === 401) {
      throw new Error(
        "ArangoDB refuse l'identifiant (401) : vérifier ARANGO_USER et " +
          "ARANGO_PASSWORD dans .env. Créer la base demande le compte root.",
        { cause: error }
      )
    }
    throw error
  }
}

/**
 * Écrit les documents, sommets d'abord. Un document dont la _key existe déjà
 * est mis à jour au lieu d'être dupliqué (overwriteMode "update") : c'est ce
 * qui rend l'import relançable.
 *
 * Limite : une relation supprimée de MusicBrainz entre deux imports reste dans
 * ArangoDB. Pour repartir de zéro : docker compose down -v, puis réimporter.
 */
export async function saveGraph(db: Database, graph: GraphDocuments) {
  const batches = [
    [COLLECTIONS.ARTISTS, graph.artists],
    [COLLECTIONS.RELEASES, graph.releases],
    [COLLECTIONS.RECORDINGS, graph.recordings],
    [COLLECTIONS.CREDITED_ARTISTS, graph.credited],
    [COLLECTIONS.MEMBER_OF, graph.memberOf],
    [COLLECTIONS.CONTAINS, graph.contains],
  ] as const

  for (const [name, documents] of batches) {
    if (documents.length === 0) continue
    // aql`` transforme chaque ${…} en paramètre lié (@value0, @@value1) :
    // aucune valeur n'est collée dans le texte de la requête.
    await db.query(aql`
      FOR doc IN ${documents}
        INSERT doc INTO ${db.collection(name)}
        OPTIONS { overwriteMode: "update" }
    `)
  }
}
