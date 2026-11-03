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
