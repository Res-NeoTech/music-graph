# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# Music Graph

Application web pour explorer les liens entre artistes (qui a joué, produit ou collaboré avec qui) sous forme de graphe, et trouver le plus court chemin entre deux artistes. Projet de cours CFC Informaticien, développeur unique, rendu fin février 2027.

Cahier des charges complet : `docs/cahier-des-charges.md`. Le lire avant toute nouvelle fonctionnalité, en particulier les besoins B1–B7 et le périmètre.

## Stack

- Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui
- PostgreSQL + Drizzle ORM : données affichées dans les pages et recherche
- ArangoDB : uniquement le graphe des relations, requêtes en AQL
- Docker Compose : PostgreSQL et ArangoDB en local
- Vitest pour les tests
- Bibliothèque de graphe : <!-- TODO : Cytoscape.js ou react-force-graph, à fixer -->

## Architecture — règles à respecter

- **Seul le script d'import appelle l'API MusicBrainz.** L'application Next.js ne fait jamais d'appel à MusicBrainz : elle lit uniquement PostgreSQL et ArangoDB.
- **Seul le script d'import écrit dans ArangoDB.** Pas de synchronisation continue entre les deux bases.
- **Le MBID (identifiant MusicBrainz) est la clé commune** aux deux bases. Ne jamais identifier un artiste par son nom (homonymes).
- **L'import est idempotent** : upsert sur MBID, relançable sans doublons, reprise après interruption. Chaque artiste importé a un statut `ok` / `failed` pour pouvoir rejouer uniquement les échecs.
- Les pochettes viennent de la Cover Art Archive, via le MBID de la release.

## MusicBrainz

- Une requête par seconde au maximum : tous les appels passent par un seul client avec limiteur de débit. Ne pas paralléliser les appels.
- User-Agent obligatoire au format `MusicGraph/<version> ( <contact> )`.
- Gérer les erreurs 503 (dépassement de débit) avec attente puis nouvel essai.
- Ne pas supposer que les relations sont complètes (crédits souvent manquants, relation « samples » rare).

## Modèle de graphe (ArangoDB)

- Sommets : `artists`, `releases`, `recordings` (`_key` = MBID)
- Arêtes : `credited` (artist → recording, attribut `role`), `member_of` (artist → artist groupe), `contains` (release → recording)
- Toujours limiter la profondeur des parcours (4 niveaux max pour un chemin) et le nombre de résultats (150 nœuds affichés max).

## Hors périmètre

Ne pas implémenter : paroles, lecture audio, recommandations, interface d'administration, import complet de MusicBrainz. Les comptes et favoris (B7) et les filtres du graphe (B6) sont optionnels : seulement après la première version utilisable (B1–B5).

## Commandes

- Dev : `npm run dev`
- Build : `npm run build`
- Lint : `npm run lint`
- Vérification des types : `npm run typecheck`
- Formatage : `npm run format` (Prettier)
- Ajouter un composant shadcn : `npx shadcn@latest add <composant>`
- Lancer les bases : `docker compose up -d --wait` (après `cp .env.example .env`). Arrêter : `docker compose down` ; tout effacer, données comprises : `docker compose down -v`

Docker (`compose.yaml`) ne contient que PostgreSQL 18 et ArangoDB 3.12 ; Next.js et le script d'import tournent sur l'hôte. PostgreSQL est exposé sur **5433** (5432 est pris par un autre projet), ArangoDB sur 8529 (interface web : http://localhost:8529). Ports liés à `127.0.0.1` uniquement.

Pas encore en place (à compléter lors de leur mise en place) :

- Migrations : <!-- TODO : Drizzle pas encore installé -->
- Import : <!-- TODO : script d'import pas encore écrit -->
- Tests : <!-- TODO : Vitest pas encore installé ; prévoir aussi la commande pour un seul fichier, ex. `npx vitest run <fichier>` -->

## Conventions

- Next.js 16 / React 19 : lire `node_modules/next/dist/docs/` avant d'utiliser une API Next (voir AGENTS.md).
- shadcn/ui en style `base-luma` : les composants reposent sur `@base-ui/react`, **pas Radix**. Ne pas importer `@radix-ui/*`.
- `cn` vient du paquet `cn` (réexporté par `lib/utils.ts`), pas de `clsx`/`tailwind-merge`.
- Alias d'import `@/*` vers la racine (pas de dossier `src/`) : `@/components`, `@/components/ui`, `@/lib`, `@/hooks`.
- Prettier : sans point-virgule, guillemets doubles, plugin Tailwind (tri des classes, y compris dans `cn()` et `cva()`).

- Secrets uniquement dans `.env` (non commité) ; maintenir `.env.example` à jour.
- Écrire des tests pour le client MusicBrainz, la transformation des données et les requêtes AQL.
- Expliquer brièvement les choix et le code généré : c'est un projet évalué, je dois pouvoir tout justifier.