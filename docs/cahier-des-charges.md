# Music Graph — Cahier des charges

Version 1.0 · Maksym · 26 octobre 2026 · Échéance : fin février 2027

## Objectif de l'application

Music Graph est une application web qui permet d'explorer les liens entre artistes : qui a joué, produit ou collaboré avec qui. Les sites de musique existants affichent les crédits morceau par morceau, mais ne montrent ni le réseau d'un artiste ni la façon dont deux artistes sont reliés.

L'objectif est de rendre ces liens visibles sous forme de graphe navigable et de trouver le chemin le plus court entre deux artistes, à partir des données ouvertes de MusicBrainz.

## Besoins à réaliser

### Besoins fonctionnels

| N° | Besoin                                                                                                                                | Priorité |
|--------|--------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| B1     | Importer un corpus d'artistes depuis MusicBrainz (artistes, albums, morceaux, crédits, relations) avec un script relançable sans doublons. | Obligatoire  |
| B2     | Rechercher des artistes, albums et morceaux, avec pagination des résultats.                                                                | Obligatoire  |
| B3     | Consulter une page artiste (infos, albums, membres), album (tracklist, pochette) et morceau (crédits par rôle).                            | Obligatoire  |
| B4     | Visualiser le graphe des relations d'un artiste sur 1 ou 2 niveaux et naviguer de nœud en nœud.                                            | Obligatoire  |
| B5     | Trouver le plus court chemin entre deux artistes (4 niveaux maximum).                                                                      | Obligatoire  |
| B6     | Filtrer le graphe par type de relation (production, featuring, membre…).                                                                   | Optionnel    |
| B7     | Créer un compte et enregistrer des artistes en favoris.                                                                                    | Optionnel    |

### Besoins non fonctionnels

- Respecter les conditions de l'API MusicBrainz : une requête par seconde au maximum, User-Agent identifiable.
- Temps de réponse : moins d'une seconde pour la recherche et les pages, moins de deux secondes pour un chemin entre deux artistes.
- Interface responsive : prévue pour ordinateur, utilisable sur mobile.
- Installation reproductible avec Docker Compose et un README.
- Aucun secret (mots de passe, clés) dans le dépôt Git.

## Périmètre

### Ce qui sera réalisé

- Les besoins B1 à B5, sur un corpus d'environ 100 artistes d'un même genre musical.
- Les pochettes d'albums via la Cover Art Archive.
- Les besoins B6 et B7 si le temps le permet, une fois la première version terminée.

### Ce qui ne sera pas réalisé

- **Paroles :aucune source libre de droits ; il faudrait les saisir à la main.
- **Lecture audio et streaming(droits d'auteur).
- Recommandations musicales, application mobile native, interface d'administration.
- Import complet de la base MusicBrainz : seul le corpus choisi est importé.

## Ressources nécessaires

| Ressource | Détail                                                                       |
|---------------|-----------------------------------------------------------------------------------|
| Temps         | Environ 160 h : 3 séances de 4 h par semaine jusqu'à fin février 2027.            |
| Matériel      | Un poste de développement capable de faire tourner Docker.                        |
| Logiciels     | Node.js, Docker Desktop, Git, un éditeur de code, un navigateur.                  |
| Comptes       | GitHub (dépôt). L'API MusicBrainz ne demande ni compte ni clé.                    |
| Données       | API MusicBrainz et Cover Art Archive, gratuites. Aucun service payant.            |
| Compétences   | À acquérir : ArangoDB et son langage AQL, une bibliothèque d'affichage de graphe. |

## Première version utilisable

La première version utilisable est visée pour fin janvier 2027. Elle contient :

- le corpus importé dans PostgreSQL et ArangoDB ;
- la recherche et les pages artiste, album et morceau ;
- le graphe des relations d'un artiste ;
- la recherche de chemin entre deux artistes.

Elle ne contient pas de comptes utilisateurs. Scénario de démonstration : rechercher un artiste, ouvrir sa page, afficher son graphe, puis trouver le chemin qui le relie à un autre artiste.

## Choix techniques

| Technologie                  | Rôle                      | Pourquoi                                                                              |
|-----------------------------------|--------------------------------|--------------------------------------------------------------------------------------------|
| Next.js + TypeScript              | Interface et routes API        | Front et back dans un seul projet, types partagés entre les deux.                          |
| Tailwind CSS + shadcn/ui          | Mise en forme                  | Composants accessibles prêts à l'emploi, style cohérent.                                   |
| PostgreSQL + Drizzle              | Données des pages et recherche | Schéma typé en TypeScript, migrations versionnées.                                         |
| ArangoDB                          | Graphe des relations           | Parcours et plus court chemin natifs en AQL, plus simples que des requêtes SQL récursives. |
| MusicBrainz + Cover Art Archive   | Source des données             | Données ouvertes (CC0), gratuites, riches en crédits et relations.                         |
| Docker Compose                    | Environnement local            | PostgreSQL et ArangoDB lancés en une commande.                                             |
| Vitest                            | Tests                          | Compatible TypeScript, rapide, simple à configurer.                                        |
| Cytoscape.js ou react-force-graph | Affichage du graphe            | Choix final après un essai pendant la conception.                                          |

### Organisation des données

- L'identifiant MusicBrainz (MBID) sert de clé commune aux deux bases.
- Seul le script d'import appelle l'API et écrit dans les bases ; l'application ne fait que lire.
- ArangoDB contient les sommets artist, release et recording, et les arêtes credited (artiste → morceau, avec le rôle), member_of (artiste → groupe) et contains (album → morceau).
- Chaque artiste importé a un statut (ok / échec) pour pouvoir relancer uniquement les échecs.

## Rôles

### Dans le projet

- **Maksym :seul développeur — analyse, conception, développement, tests et documentation.
- **Enseignant :validation du cahier des charges, suivi et évaluation.

### Dans l'application

- **Visiteur :accès à toutes les fonctionnalités de consultation, sans compte.
- **Utilisateur connecté (optionnel, B7) :peut en plus enregistrer des favoris.

Il n'y a pas d'administrateur dans l'interface : l'import se fait en ligne de commande par le développeur.

## Premières étapes et planning

### Premières étapes

1.  Faire valider ce cahier des charges.

2.  Choisir le genre et la liste des artistes, et vérifier leurs crédits sur MusicBrainz.

3.  Dessiner les maquettes papier : recherche, page artiste, graphe, chemin.

4.  Créer le dépôt GitHub, le projet Next.js et le Docker Compose (PostgreSQL, ArangoDB).

5.  Définir le schéma Drizzle et les collections ArangoDB.

6.  Faire un premier appel MusicBrainz et une première requête AQL pour valider les choix techniques.

### Planning

| Période         | Travail                                                        |
|----------------------|---------------------------------------------------------------------|
| Sem. 1–2 (nov.)      | Étapes 1 à 6 ci-dessus.                                             |
| Sem. 3–5 (nov.–déc.) | Script d'import et ses tests, premier import complet du corpus.     |
| Sem. 6–7 (déc.)      | Recherche, pages artiste, album et morceau.                         |
| Vacances de Noël     | —                                                                   |
| Sem. 8–10 (janv.)    | Graphe et chemin entre deux artistes → première version utilisable. |
| Sem. 11–12 (févr.)   | Besoins optionnels ou rattrapage du retard.                         |
| Sem. 13–14 (févr.)   | Tests, README, documentation, préparation de la présentation.       |

Les dates seront ajustées au calendrier scolaire. Un journal de travail est tenu à chaque séance.

## Risques

| Risque                        | Mesure prévue                                                                         |
|------------------------------------|--------------------------------------------------------------------------------------------|
| Crédits incomplets sur MusicBrainz | Corpus choisi après vérification des données.                                              |
| Homonymes et changements de nom    | Tout est identifié par MBID, jamais par nom.                                               |
| Artistes très connectés            | Profondeur et nombre de nœuds limités dans chaque requête (150 nœuds affichés au maximum). |
| Import lent (1 requête/s)          | Import lancé en dehors des séances, avec reprise après interruption.                       |
| ArangoDB nouveau pour moi          | Premières requêtes AQL testées dès la semaine 2.                                           |
| Retard                             | Les besoins optionnels sont abandonnés en premier ; la première version reste prioritaire. |

## Critères de réussite

- Le projet démarre depuis le README : docker compose up, migrations, script d'import.
- B1 : relancer l'import ne crée aucun doublon et le débit ne dépasse jamais une requête par seconde.
- B2–B3 : la recherche retrouve les éléments du corpus et gère le cas « aucun résultat » ; les pages affichent des données cohérentes avec MusicBrainz.
- B4–B5 : le graphe reste lisible et le chemin entre deux artistes est trouvé (ou son absence indiquée) en moins de deux secondes.
- Tests unitaires sur le client MusicBrainz et la transformation des données ; tests d'intégration sur les requêtes AQL.
- Livrables remis : code sur GitHub, README, documentation de l'architecture, journal de travail et présentation finale avec démonstration.