import { sql } from "drizzle-orm"
import {
  type AnyPgColumn,
  boolean,
  char,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

// Schéma détaillé et justifications : docs/postgres/mld.md

// ---------------------------------------------------------------- enums

export const artistType = pgEnum("artist_type", [
  "person",
  "group",
  "orchestra",
  "choir",
  "character",
  "other",
])

export const releaseType = pgEnum("release_type", [
  "album",
  "ep",
  "single",
  "broadcast",
  "other",
])

export const importStatus = pgEnum("import_status", ["pending", "ok", "failed"])

export const roleCategory = pgEnum("role_category", [
  "performance",
  "production",
  "engineering",
  "writing",
])

// --------------------------------------------------------------- helpers

// Date partielle MusicBrainz : "1991", "1991-09" ou "1991-09-24".
// Stockée en texte ISO : l'ordre alphabétique est l'ordre chronologique.
const partialDate = (name: string) => varchar(name, { length: 10 })

const partialDateCheck = (name: string, column: AnyPgColumn) =>
  check(name, sql`${column} ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$'`)

// ------------------------------------------------------------- entities

export const artists = pgTable(
  "artists",
  {
    mbid: uuid("mbid").primaryKey(),
    name: text("name").notNull(),
    sortingName: text("sorting_name").notNull(),
    type: artistType("type"),
    country: char("country", { length: 2 }),
    startDate: partialDate("start_date"),
    finishDate: partialDate("finish_date"),
    disambiguation: text("disambiguation"),
    // NULL = artiste découvert via une relation, hors corpus
    importStatus: importStatus("import_status"),
    importError: text("import_error"),
    importDate: timestamp("import_date", { withTimezone: true }),
  },
  (t) => [
    partialDateCheck("artists_start_date_check", t.startDate),
    partialDateCheck("artists_finish_date_check", t.finishDate),
    index("artists_name_trgm_idx").using("gin", t.name.op("gin_trgm_ops")),
  ]
)

export const releases = pgTable(
  "releases",
  {
    mbid: uuid("mbid").primaryKey(),
    // une seule édition par album
    releaseGroupMbid: uuid("release_group_mbid").notNull().unique(),
    title: text("title").notNull(),
    type: releaseType("type"),
    releaseDate: partialDate("release_date"),
    hasCoverArt: boolean("has_cover_art").notNull().default(false),
  },
  (t) => [
    partialDateCheck("releases_release_date_check", t.releaseDate),
    index("releases_title_trgm_idx").using("gin", t.title.op("gin_trgm_ops")),
  ]
)

export const recordings = pgTable(
  "recordings",
  {
    mbid: uuid("mbid").primaryKey(),
    title: text("title").notNull(),
    durationMs: integer("duration_ms"),
    disambiguation: text("disambiguation"),
  },
  (t) => [
    check("recordings_duration_ms_check", sql`${t.durationMs} > 0`),
    index("recordings_title_trgm_idx").using("gin", t.title.op("gin_trgm_ops")),
  ]
)

export const tracks = pgTable(
  "tracks",
  {
    mbid: uuid("mbid").primaryKey(),
    releaseMbid: uuid("release_mbid")
      .notNull()
      .references(() => releases.mbid, { onDelete: "cascade" }),
    recordingMbid: uuid("recording_mbid")
      .notNull()
      .references(() => recordings.mbid),
    discNumber: smallint("disc_number").notNull(),
    position: smallint("position").notNull(),
    // titre et durée tels qu'imprimés sur cette édition
    title: text("title").notNull(),
    durationMs: integer("duration_ms"),
  },
  (t) => [
    unique("tracks_release_disc_position_unique").on(
      t.releaseMbid,
      t.discNumber,
      t.position
    ),
    index("tracks_recording_mbid_idx").on(t.recordingMbid),
    check("tracks_disc_number_check", sql`${t.discNumber} >= 1`),
    check("tracks_position_check", sql`${t.position} >= 1`),
  ]
)

// Table de référence, remplie par une migration (pas par l'import)
export const roles = pgTable("roles", {
  // nom du type de relation MusicBrainz, = credited.role dans ArangoDB
  code: varchar("code", { length: 32 }).primaryKey(),
  label: text("label").notNull(),
  category: roleCategory("category").notNull(),
})

// --------------------------------------------------------- associations

// Crédit d'artiste d'un album : « A feat. B » = (A, 1, " feat. "), (B, 2, "")
export const releaseArtists = pgTable(
  "release_artists",
  {
    releaseMbid: uuid("release_mbid")
      .notNull()
      .references(() => releases.mbid, { onDelete: "cascade" }),
    artistMbid: uuid("artist_mbid")
      .notNull()
      .references(() => artists.mbid),
    position: smallint("position").notNull(),
    creditedName: text("credited_name").notNull(),
    joinPhrase: text("join_phrase").notNull().default(""),
  },
  (t) => [
    primaryKey({ columns: [t.releaseMbid, t.artistMbid] }),
    unique("release_artists_release_position_unique").on(
      t.releaseMbid,
      t.position
    ),
    index("release_artists_artist_mbid_idx").on(t.artistMbid),
  ]
)

// Crédit d'artiste d'un morceau, même structure que release_artists
export const recordingArtists = pgTable(
  "recording_artists",
  {
    recordingMbid: uuid("recording_mbid")
      .notNull()
      .references(() => recordings.mbid, { onDelete: "cascade" }),
    artistMbid: uuid("artist_mbid")
      .notNull()
      .references(() => artists.mbid),
    position: smallint("position").notNull(),
    creditedName: text("credited_name").notNull(),
    joinPhrase: text("join_phrase").notNull().default(""),
  },
  (t) => [
    primaryKey({ columns: [t.recordingMbid, t.artistMbid] }),
    unique("recording_artists_recording_position_unique").on(
      t.recordingMbid,
      t.position
    ),
    index("recording_artists_artist_mbid_idx").on(t.artistMbid),
  ]
)

// Association ternaire : un artiste peut avoir plusieurs rôles sur un morceau
export const credits = pgTable(
  "credits",
  {
    recordingMbid: uuid("recording_mbid")
      .notNull()
      .references(() => recordings.mbid, { onDelete: "cascade" }),
    artistMbid: uuid("artist_mbid")
      .notNull()
      .references(() => artists.mbid),
    roleCode: varchar("role_code", { length: 32 })
      .notNull()
      .references(() => roles.code),
    // attributs de la relation : "bass guitar", "lead vocals"…
    detail: text("detail"),
  },
  (t) => [
    primaryKey({ columns: [t.recordingMbid, t.artistMbid, t.roleCode] }),
    index("credits_artist_mbid_idx").on(t.artistMbid),
  ]
)

// Association réflexive artiste (membre) → artiste (groupe)
export const memberships = pgTable(
  "memberships",
  {
    groupMbid: uuid("group_mbid")
      .notNull()
      .references(() => artists.mbid),
    memberMbid: uuid("member_mbid")
      .notNull()
      .references(() => artists.mbid),
    startDate: partialDate("start_date"),
    finishDate: partialDate("finish_date"),
    // instruments, voix
    detail: text("detail"),
  },
  (t) => [
    primaryKey({ columns: [t.groupMbid, t.memberMbid] }),
    index("memberships_member_mbid_idx").on(t.memberMbid),
    check("memberships_not_self_check", sql`${t.groupMbid} <> ${t.memberMbid}`),
    partialDateCheck("memberships_start_date_check", t.startDate),
    partialDateCheck("memberships_finish_date_check", t.finishDate),
  ]
)

// ------------------------------------------------------ B7 (optionnel)

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    creationDate: timestamp("creation_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(sql`lower(${t.email})`)]
)

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistMbid: uuid("artist_mbid")
      .notNull()
      .references(() => artists.mbid),
    creationDate: timestamp("creation_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.artistMbid] })]
)
