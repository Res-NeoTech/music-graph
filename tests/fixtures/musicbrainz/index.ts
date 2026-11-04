import type {
  MbArtist,
  MbRelease,
  MbReleaseBrowse,
} from "@/import/musicbrainz/types"

import artist from "./artist-ye.json"
import release from "./release-mbdtf.json"
import releases from "./releases-ye.json"

// Vraies réponses de l'API MusicBrainz (novembre 2026), réduites aux champs
// lus par l'import. Chaque appel renvoie une copie : un test peut la modifier
// sans influencer les autres.

/**
 * GET /artist/{Ye}?inc=artist-rels — les 9 relations « member of band »
 * (Ye est une personne : relations « forward » vers ses groupes) et une
 * relation d'un autre type.
 */
export const yeArtist = () => structuredClone(artist) as MbArtist

/**
 * GET /release?artist={Ye}&type=album|ep&status=official&inc=release-groups
 * Extrait : toutes les éditions de 8 albums (64 releases sur 184), choisis
 * pour couvrir chaque règle de pickReleases().
 */
export const yeReleases = () => structuredClone(releases) as MbReleaseBrowse

/**
 * GET /release/{My Beautiful Dark Twisted Fantasy}?inc=… — édition CD + DVD,
 * 3 premiers morceaux de chaque disque : Dark Fantasy, Gorgeous, Power
 * (disque 1) et le film Runaway (disque 2).
 */
export const mbdtfRelease = () => structuredClone(release) as MbRelease

/** Mêmes codes que la table roles (migration seed_roles) */
export const ROLE_CODES: ReadonlySet<string> = new Set([
  "performer",
  "vocal",
  "instrument",
  "producer",
  "programming",
  "arranger",
  "remixer",
  "engineer",
  "recording",
  "mix",
  "mastering",
  "composer",
  "lyricist",
  "writer",
])

export const MBID = {
  /** Ye, anciennement Kanye West : les crédits impriment encore « Kanye West » */
  YE: "164f0d73-1234-4e2c-8743-d77bf2191051",
  KID_CUDI: "e0e1db18-f7ba-4dee-95ff-7ae8cf545460",
  RAEKWON: "4e954b02-fae2-4bd7-9547-e055a6ac0527",
  MIKE_DEAN: "73e36439-1e9a-4925-bf2c-1d7f7885fbb0",
  KIDS_SEE_GHOSTS: "793e220b-64f8-46d9-954d-e033dbcfeef4",
  /** ¥$, avec Ty Dolla $ign */
  YE_TY_DOLLA_SIGN: "58daf317-be5f-439f-a04d-0d6727f1a3b2",
  CHILD_REBEL_SOLDIER: "9563442b-69e2-43cf-8012-3c9371f174cb",
  MBDTF: "cd474271-bd7a-4d53-ba9e-e9d5bd7958cb",
  MBDTF_GROUP: "5d6e21e1-deb5-428e-bb42-c2a567f3619b",
  DARK_FANTASY: "885ccb38-4057-4d1a-8fb0-52804f79d653",
  GORGEOUS: "b3c6aa0a-6960-4db6-bf27-ed50de88309c",
} as const
