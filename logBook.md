# Music Graph

## Journal de bord — Maksym Ptytsia

> Les durées ci-dessous sont des estimations reconstituées après coup. Une période correspond approximativement à 45 minutes. Elles servent à rendre compte du suivi du travail et ne modifient pas le contenu des réalisations consignées.

---

## 26.10.2026 — Documentation

**Durée :** 4 périodes

- Rédaction de la documentation préalable (hors dépôt).
- **Pourquoi :** définir le périmètre avant de coder, pour éviter que le projet grossisse sans fin.

---

## 27.10.2026 — Mise en place du projet

**Durée :** 4 périodes

- Création du projet Next.js avec TypeScript, Tailwind CSS et shadcn/ui.
- Docker Compose avec PostgreSQL et ArangoDB, fichier `.env.example`.
- **Pourquoi deux bases :** PostgreSQL pour les pages et la recherche, ArangoDB pour le graphe, car le plus court chemin y est natif (plus simple qu'en SQL).
- **Pourquoi Docker :** les bases se lancent en une seule commande. PostgreSQL est sur le port 5433, car le 5432 est déjà utilisé par un autre projet.

---

## 28.10.2026 — Logo et base de données

**Durée :** 4 périodes

- Création du logo : trois concepts comparés, choix du concept « Liaisons ».
- MCD/MLD, puis schéma Drizzle et migrations PostgreSQL.
- **Pourquoi ce logo :** le « m » est formé de trois notes reliées par des arcs, comme des artistes reliés dans un graphe.
- **Pourquoi le MBID comme clé :** c'est l'identifiant stable de MusicBrainz, commun aux deux bases. Relancer l'import ne crée pas de doublons.

---

## 02.11.2026 — Mise en page et page 404

**Durée :** 4 périodes

- Métadonnées du site, `robots.txt` et `sitemap.xml`.
- En-tête (logo, navigation, thème clair/sombre) et pied de page.
- Page 404 personnalisée.
- **Pourquoi :** l'en-tête et le pied de page sont écrits une fois dans le layout et partagés par toutes les pages.

---

## 03.11.2026 — Page d'accueil et documentation

**Durée :** 4 périodes

- Page d'accueil : titre, barre de recherche, graphe décoratif et section « How it works ».
- Mise à jour de Next.js et correction des avertissements ESLint.
- Amélioration de la documentation.
- **Pourquoi :** la recherche est l'action principale, elle est donc au centre de la page. La recherche passe par l'URL (`/search?q=...`), on peut donc la partager.

---

## 04.11.2026 — Connexions aux bases et script d'import

**Durée :** 4 périodes

- Connexion à ArangoDB et lecture centralisée des variables d'environnement.
- Installation de Vitest et migration qui remplit la table `roles`.
- Première version du script d'import (client MusicBrainz, transformation, chargement), encore incomplète.
- **Pourquoi un seul client MusicBrainz :** l'API accepte une requête par seconde. Tous les appels passent donc par le même limiteur de débit.

---

## 09.11.2026 — Corpus d'artistes

**Durée :** 4 périodes

- Script qui génère le corpus : il cherche le MBID de 100 artistes à partir de leur nom.
- Fonction `selectArtistsToImport()` : importe tous les artistes, ou seulement ceux qui ont échoué.
- **Pourquoi :** l'import complet est long. Après une interruption, on ne reprend que les artistes sans statut `ok`.

---

## 10.11.2026 — Transformation des données

**Durée :** 4 périodes

- `pickReleases()` : garde une seule édition par album.
- `toMemberships()` : relations entre un groupe et ses membres.
- `toCreditRoles()` : distingue l'artiste principal des invités (« feat. »).
- **Pourquoi une seule édition :** un album a souvent des dizaines d'éditions. Les importer toutes créerait des doublons de morceaux.

---

## 11.11.2026 — Pages artiste et pagination

**Durée :** 4 périodes

- Liste des artistes (`/artists`) et page de détail (`/artists/[mbid]`).
- Pagination de la liste : 24 artistes par page, numéro de page dans l'URL.
- Début de la page de recherche, à terminer.
- **Pourquoi la pagination :** la table contient plus de 6000 artistes, tout afficher d'un coup était lent. La base ne renvoie que la page demandée.
