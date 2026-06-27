# C15-TOUR — Éditeur d'itinéraires cartographiques

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/projet-priv%C3%A9-lightgrey)

Application web permettant de **concevoir, calculer et partager des itinéraires touristiques** sur une carte interactive. L'organisateur place des points d'intérêt, les organise par glisser-déposer, calcule automatiquement le tracé routier entre eux, puis publie l'événement et le diffuse aux participants via un **code de partage**.

> 🧭 Projet d'étude **C15-TOUR** — Sup de Vinci (Master). Ce dépôt contient le **front-end** ; il communique avec une API back-end distante (par défaut `https://c15-tour-back.vercel.app`).

<!--
  📸 Capture d'écran / GIF de démonstration à insérer ici.
  Ajoutez l'image dans docs/ puis décommentez le bloc ci-dessous :

  <p align="center">
    <img src="docs/screenshot.png" alt="Aperçu de l'éditeur d'itinéraires C15-TOUR" width="800" />
  </p>
-->

---

## ✨ Fonctionnalités

- 🗺️ **Carte interactive** (Leaflet / React-Leaflet) avec recherche d'adresses et géocodage intégré.
- 📍 **Gestion de points de passage (waypoints)** : ajout par clic ou recherche, libellés, adresses, types de points et regroupement par **groupes** colorés.
- 🧮 **Calcul d'itinéraire automatique** via [OSRM](https://project-osrm.org/) — distance, durée et tracé complet, avec **optimisation de l'ordre** des points (problème du voyageur de commerce).
- 🖱️ **Réorganisation par glisser-déposer** des points et des groupes (`@dnd-kit`), panneau latéral redimensionnable (desktop & mobile).
- 🔗 **Publication & partage** : chaque itinéraire publié génère un **code de partage** transmissible aux participants.
- 🔐 **Authentification** : connexion, routes protégées et **espace administrateur** (création de comptes réservée aux admins).

### Ce qui le distingue

Contrairement à un simple traceur de carte, C15-TOUR modélise un **événement touristique complet** (dates, nombre de participants max, groupes, points typés) et persiste le tout côté serveur avec **sauvegarde automatique** et gestion d'état différentiel (`isDirty` / file d'attente de sauvegarde).

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** ≥ 20.19 (ou 22.12+) — requis par Vite 7
- **npm** ≥ 9 (ou pnpm / yarn)

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/C15-TOUR-SUPDEVINCI/C15-tour-web-map-prototype.git
cd C15-tour-web-map-prototype

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env

# 4. Lancer le serveur de développement
npm run dev
```

### Résultat attendu

```
  VITE v7.2.4  ready in 420 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Ouvrez **[localhost:5173](http://localhost:5173)** : vous serez redirigé vers la page de connexion, puis vers le tableau de bord après authentification.

---

## 📖 Utilisation détaillée

### Scripts disponibles

| Commande          | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Serveur de développement Vite avec HMR (port 5173)     |
| `npm run build`   | Vérifie les types (`tsc -b`) puis build de production  |
| `npm run preview` | Sert localement le build de production                 |
| `npm run lint`    | Analyse statique du code avec ESLint                   |

### Cas d'usage courants

**1. Créer un itinéraire**
1. Depuis le **tableau de bord**, cliquez sur *Nouveau*.
2. Recherchez une adresse ou cliquez sur la carte pour ajouter des points.
3. Glissez-déposez pour réordonner, ou activez l'**optimisation** pour le trajet le plus court.

**2. Organiser par groupes**
Créez des groupes colorés et répartissez les points pour structurer les étapes d'un parcours.

**3. Publier et partager**
Renseignez le nom, la description, les dates et le nombre de participants, puis publiez. Un **code de partage** est généré et copiable en un clic.

### Configuration

La configuration se fait via des variables d'environnement (préfixe `VITE_` requis par Vite) dans un fichier `.env` à la racine :

```env
# URL de l'API back-end (obligatoire en production)
VITE_API_URL=https://c15-tour-back.vercel.app
```

| Variable       | Requis | Valeur par défaut                       | Description                          |
| -------------- | ------ | --------------------------------------- | ------------------------------------ |
| `VITE_API_URL` | Non\*  | `https://c15-tour-back.vercel.app`      | URL de base de l'API back-end        |

> \* En développement, si la variable est absente, l'application bascule sur l'URL de production en émettant un avertissement console (voir [src/config.ts](src/config.ts)).

---

## 🔌 Référence API (front-end)

Le client HTTP centralisé ([src/lib/apiClient.ts](src/lib/apiClient.ts)) gère l'authentification par jeton Bearer et le parsing des réponses.

```ts
import { apiClient } from './lib/apiClient';

apiClient.get<T>(endpoint, options?)            // Requête GET
apiClient.post<T>(endpoint, body?, options?)    // Requête POST
apiClient.patch<T>(endpoint, body?, options?)   // Requête PATCH
apiClient.delete<T>(endpoint, options?)         // Requête DELETE
```

**Options** (`ApiClientOptions`) : `authToken?: string`, `skipAuth?: boolean`, plus toutes les options de `fetch`.
Les erreurs HTTP sont levées sous forme de `ApiHttpError` (`status`, `body`).

### Service de routage — [src/services/routing.service.ts](src/services/routing.service.ts)

```ts
calculateRoute(waypoints: Waypoint[], options?: RouteOptions): Promise<RouteResult | null>
```

| Paramètre   | Type           | Description                                                        |
| ----------- | -------------- | ----------------------------------------------------------------- |
| `waypoints` | `Waypoint[]`   | Au moins 2 points (`{ lat, lng }`)                                 |
| `options`   | `RouteOptions` | `{ optimize?: boolean; algorithm?: 'fastest' \| 'shortest' }`     |

**Retour** `RouteResult` : `coordinates` (tracé `[lat, lng][]`), `distance` (m), `duration` (s), `legs[]`, et `waypointOrder?` si optimisation activée.

Utilitaires de formatage : `formatDistance(meters)` → `"12.40 km"`, `formatDuration(seconds)` → `"1h 30min"`.

---

## 🛠️ Stack technique

| Domaine           | Technologies                                                        |
| ----------------- | ------------------------------------------------------------------- |
| **Framework**     | React 19, React Router 7                                            |
| **Langage**       | TypeScript 5.9                                                      |
| **Build / Dev**   | Vite 7                                                              |
| **Cartographie**  | Leaflet, React-Leaflet, leaflet-control-geocoder, OSRM             |
| **État**          | Zustand                                                            |
| **Drag & drop**   | @dnd-kit (core / sortable / utilities)                             |
| **UI / Icônes**   | lucide-react                                                       |
| **Qualité**       | ESLint, typescript-eslint                                          |

### Architecture

```
src/
├── components/   # Composants UI (Auth, Dashboard, Map, Waypoints, UI partagée)
├── views/        # Pages routées (Login, Signup, EditorView, ...)
├── store/        # Stores Zustand (useAuthStore, useRouteStore)
├── services/     # Appels API & logique métier (routing, geocoding, ...)
├── domain/       # Types & constantes du domaine
├── lib/          # apiClient, gestion d'erreurs
└── config.ts     # Configuration via variables d'environnement
```

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Pour participer :

1. **Forkez** le dépôt et créez une branche depuis `main` :
   ```bash
   git checkout -b ma-fonctionnalite
   ```
2. **Configurez** l'environnement de dev : `npm install`, puis `npm run dev`.
3. **Respectez le style de code** : avant chaque commit, exécutez
   ```bash
   npm run lint
   npm run build   # vérifie aussi les types
   ```
4. **Commits** : messages clairs et conventionnels (`feat:`, `fix:`, `refactor:`, ...).
5. **Ouvrez une Pull Request** vers `main` en décrivant le contexte et les changements.

### Conventions de code

- TypeScript strict — pas de `any` implicite.
- Composants fonctionnels React + hooks.
- Respect des règles `eslint-plugin-react-hooks`.
- Commentaires métier en français, cohérents avec l'existant.

---

## 📄 Crédits

> Projet **privé**, réalisé dans un cadre pédagogique (non distribué publiquement). Aucune licence open source n'est accordée — tous droits réservés aux auteurs ci-dessous.

### Réalisé par

**Chef de projet**

- Johnny DE OLIVEIRA

**Développeurs**

- Raoul BONSSO
- Nolan COHONER
- Maxime KINIFFO
- Coleen MICLO
- Wilfried NGUEGUIM
- Kyllian RONNE

### Remerciements

- [OpenStreetMap](https://www.openstreetmap.org/) — données cartographiques
- [Project OSRM](https://project-osrm.org/) — moteur de calcul d'itinéraires
- [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- L'équipe **C15-TOUR** — Sup de Vinci

---

<p align="center"><sub>Projet d'étude C15 — réalisé dans le cadre du Master à Sup de Vinci.</sub></p>
