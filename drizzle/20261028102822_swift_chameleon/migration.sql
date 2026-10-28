-- Ajouté à la main : les index GIN (gin_trgm_ops) ont besoin de pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "artist_type" AS ENUM('person', 'group', 'orchestra', 'choir', 'character', 'other');--> statement-breakpoint
CREATE TYPE "import_status" AS ENUM('pending', 'ok', 'failed');--> statement-breakpoint
CREATE TYPE "release_type" AS ENUM('album', 'ep', 'single', 'broadcast', 'other');--> statement-breakpoint
CREATE TYPE "role_category" AS ENUM('performance', 'production', 'engineering', 'writing');--> statement-breakpoint
CREATE TABLE "artists" (
	"mbid" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"sorting_name" text NOT NULL,
	"type" "artist_type",
	"country" char(2),
	"start_date" varchar(10),
	"finish_date" varchar(10),
	"disambiguation" text,
	"import_status" "import_status",
	"import_error" text,
	"import_date" timestamp with time zone,
	CONSTRAINT "artists_start_date_check" CHECK ("start_date" ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$'),
	CONSTRAINT "artists_finish_date_check" CHECK ("finish_date" ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$')
);
--> statement-breakpoint
CREATE TABLE "credits" (
	"recording_mbid" uuid,
	"artist_mbid" uuid,
	"role_code" varchar(32),
	"detail" text,
	CONSTRAINT "credits_pkey" PRIMARY KEY("recording_mbid","artist_mbid","role_code")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" uuid,
	"artist_mbid" uuid,
	"creation_date" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_pkey" PRIMARY KEY("user_id","artist_mbid")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"group_mbid" uuid,
	"member_mbid" uuid,
	"start_date" varchar(10),
	"finish_date" varchar(10),
	"detail" text,
	CONSTRAINT "memberships_pkey" PRIMARY KEY("group_mbid","member_mbid"),
	CONSTRAINT "memberships_not_self_check" CHECK ("group_mbid" <> "member_mbid"),
	CONSTRAINT "memberships_start_date_check" CHECK ("start_date" ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$'),
	CONSTRAINT "memberships_finish_date_check" CHECK ("finish_date" ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$')
);
--> statement-breakpoint
CREATE TABLE "recording_artists" (
	"recording_mbid" uuid,
	"artist_mbid" uuid,
	"position" smallint NOT NULL,
	"credited_name" text NOT NULL,
	"join_phrase" text DEFAULT '' NOT NULL,
	CONSTRAINT "recording_artists_pkey" PRIMARY KEY("recording_mbid","artist_mbid"),
	CONSTRAINT "recording_artists_recording_position_unique" UNIQUE("recording_mbid","position")
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"mbid" uuid PRIMARY KEY,
	"title" text NOT NULL,
	"duration_ms" integer,
	"disambiguation" text,
	CONSTRAINT "recordings_duration_ms_check" CHECK ("duration_ms" > 0)
);
--> statement-breakpoint
CREATE TABLE "release_artists" (
	"release_mbid" uuid,
	"artist_mbid" uuid,
	"position" smallint NOT NULL,
	"credited_name" text NOT NULL,
	"join_phrase" text DEFAULT '' NOT NULL,
	CONSTRAINT "release_artists_pkey" PRIMARY KEY("release_mbid","artist_mbid"),
	CONSTRAINT "release_artists_release_position_unique" UNIQUE("release_mbid","position")
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"mbid" uuid PRIMARY KEY,
	"release_group_mbid" uuid NOT NULL UNIQUE,
	"title" text NOT NULL,
	"type" "release_type",
	"release_date" varchar(10),
	"has_cover_art" boolean DEFAULT false NOT NULL,
	CONSTRAINT "releases_release_date_check" CHECK ("release_date" ~ '^[0-9]{4}(-[0-9]{2}(-[0-9]{2})?)?$')
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"code" varchar(32) PRIMARY KEY,
	"label" text NOT NULL,
	"category" "role_category" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"mbid" uuid PRIMARY KEY,
	"release_mbid" uuid NOT NULL,
	"recording_mbid" uuid NOT NULL,
	"disc_number" smallint NOT NULL,
	"position" smallint NOT NULL,
	"title" text NOT NULL,
	"duration_ms" integer,
	CONSTRAINT "tracks_release_disc_position_unique" UNIQUE("release_mbid","disc_number","position"),
	CONSTRAINT "tracks_disc_number_check" CHECK ("disc_number" >= 1),
	CONSTRAINT "tracks_position_check" CHECK ("position" >= 1)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"creation_date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "artists_name_trgm_idx" ON "artists" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "credits_artist_mbid_idx" ON "credits" ("artist_mbid");--> statement-breakpoint
CREATE INDEX "memberships_member_mbid_idx" ON "memberships" ("member_mbid");--> statement-breakpoint
CREATE INDEX "recording_artists_artist_mbid_idx" ON "recording_artists" ("artist_mbid");--> statement-breakpoint
CREATE INDEX "recordings_title_trgm_idx" ON "recordings" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "release_artists_artist_mbid_idx" ON "release_artists" ("artist_mbid");--> statement-breakpoint
CREATE INDEX "releases_title_trgm_idx" ON "releases" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "tracks_recording_mbid_idx" ON "tracks" ("recording_mbid");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" (lower("email"));--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_recording_mbid_recordings_mbid_fkey" FOREIGN KEY ("recording_mbid") REFERENCES "recordings"("mbid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_artist_mbid_artists_mbid_fkey" FOREIGN KEY ("artist_mbid") REFERENCES "artists"("mbid");--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_role_code_roles_code_fkey" FOREIGN KEY ("role_code") REFERENCES "roles"("code");--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_artist_mbid_artists_mbid_fkey" FOREIGN KEY ("artist_mbid") REFERENCES "artists"("mbid");--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_group_mbid_artists_mbid_fkey" FOREIGN KEY ("group_mbid") REFERENCES "artists"("mbid");--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_mbid_artists_mbid_fkey" FOREIGN KEY ("member_mbid") REFERENCES "artists"("mbid");--> statement-breakpoint
ALTER TABLE "recording_artists" ADD CONSTRAINT "recording_artists_recording_mbid_recordings_mbid_fkey" FOREIGN KEY ("recording_mbid") REFERENCES "recordings"("mbid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recording_artists" ADD CONSTRAINT "recording_artists_artist_mbid_artists_mbid_fkey" FOREIGN KEY ("artist_mbid") REFERENCES "artists"("mbid");--> statement-breakpoint
ALTER TABLE "release_artists" ADD CONSTRAINT "release_artists_release_mbid_releases_mbid_fkey" FOREIGN KEY ("release_mbid") REFERENCES "releases"("mbid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "release_artists" ADD CONSTRAINT "release_artists_artist_mbid_artists_mbid_fkey" FOREIGN KEY ("artist_mbid") REFERENCES "artists"("mbid");--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_release_mbid_releases_mbid_fkey" FOREIGN KEY ("release_mbid") REFERENCES "releases"("mbid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_recording_mbid_recordings_mbid_fkey" FOREIGN KEY ("recording_mbid") REFERENCES "recordings"("mbid");