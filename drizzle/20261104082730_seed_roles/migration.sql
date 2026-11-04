-- Custom SQL migration file, put your code below! --
-- Table de référence des rôles (docs/postgres/mld.md, « Rôles proposés »).
-- code = nom du type de relation MusicBrainz, = credited.role dans ArangoDB.
-- L'import ignore les relations dont le type n'est pas dans cette table.
INSERT INTO "roles" ("code", "label", "category") VALUES
  ('performer',   'Performer',          'performance'),
  ('vocal',       'Vocals',             'performance'),
  ('instrument',  'Instrument',         'performance'),
  ('producer',    'Production',         'production'),
  ('programming', 'Programming',        'production'),
  ('arranger',    'Arrangement',        'production'),
  ('remixer',     'Remixing',           'production'),
  ('engineer',    'Sound Engineer',     'engineering'),
  ('recording',   'Recording',          'engineering'),
  ('mix',         'Mixing',             'engineering'),
  ('mastering',   'Mastering',           'engineering'),
  ('composer',    'Composition',        'writing'),
  ('lyricist',    'Lyrics',             'writing'),
  ('writer',      'Writing',            'writing')
ON CONFLICT ("code") DO UPDATE
  SET "label" = EXCLUDED."label", "category" = EXCLUDED."category";
