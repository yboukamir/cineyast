# Cineyast

Site de découverte et de recommandation de films pour cinéphiles — [cineyast.com](https://cineyast.com).
Tendances de la semaine, recherche par titre, filtres (genre, année, note), fiches détaillées avec casting et
bande-annonce, recommandations, et une liste de favoris personnelle.

Conçu et développé par **Yassine Boukamir**. Toutes les données viennent de l'API publique
[TMDB](https://www.themoviedb.org/) — aucune donnée de film n'est codée en dur.

![Page d'accueil de Cineyast : carrousel des tendances de la semaine](docs/capture-accueil.jpg)

*Accueil — les tendances de la semaine dans un carrousel « pellicule », données réelles de l'API TMDB.*

![Fiche détaillée du film Fight Club : affiche, note, réalisation et bande-annonce](docs/capture-fiche.jpg)

*Fiche film — note, classification française, casting, bande-annonce et recommandations.*

## Stack

| Rôle | Choix |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Routage | React Router (pages chargées à la demande) |
| Données | TanStack Query (cache, pagination infinie) |
| Animations | Motion |
| Polices | Bodoni Moda · Big Shoulders Display · Hanken Grotesk, auto-hébergées via Fontsource |
| Build | Vite |
| Production | Hébergement mutualisé LWS (Apache + PHP) |

### Composants issus du catalogue 21st.dev

Récupérés via le serveur MCP 21st.dev (Magic), puis adaptés à la charte et aux besoins :

| Composant (auteur) | Fichier | Adaptations principales |
| --- | --- | --- |
| Hero Carousel (crafterui) | `src/components/ui/hero-carousel.tsx` | affiche + backdrop, molette verticale rendue à la page, clic = fiche |
| Rating (haydenbleasel) | `src/components/ui/rating.tsx` | lecture seule, note /10 → 5 étoiles partielles, libellé accessible |
| Input + démo recherche (originui) | `src/components/ui/input.tsx`, `src/components/SearchBar.tsx` | bouton effacer, rôle `search` |
| Selector Chips (preetsuthar17) | `src/components/ui/selector-chips.tsx` | contrôlé, générique, sans animation de largeur |
| Movie Pass Button (radiumcoders) | `src/components/ui/ticket-button.tsx` | encoches par masque CSS (fonctionne sur image), variantes, lien |
| Scroller (diceui) | `src/components/ui/scroller.tsx` | horizontal, sans Radix, flèches « page par page » |
| Reveal on hover (youcefbnm) | `src/components/ui/reveal-on-hover.tsx` | révélation aussi au focus clavier |

## 1. Obtenir une clé API TMDB (gratuite)

1. Créez un compte sur <https://www.themoviedb.org/signup> et validez l'e-mail de confirmation.
2. Connecté, ouvrez **Avatar → Paramètres → API** (<https://www.themoviedb.org/settings/api>).
3. Cliquez sur **Créer / Demander une clé d'API**, choisissez le type **Developer** et acceptez les conditions d'utilisation.
4. Remplissez le formulaire : type d'application *Website*, nom *Cineyast*, URL `https://cineyast.com`,
   courte description (« site perso de découverte de films, non commercial »), puis vos coordonnées.
5. La page API affiche alors deux identifiants — **l'un ou l'autre** fonctionne ici :
   - **Clé d'API** (v3) : 32 caractères hexadécimaux ;
   - **Jeton d'accès en lecture à l'API** (v4) : longue chaîne commençant par `eyJ…`.

L'usage est gratuit pour un projet non commercial. Un usage commercial demande une licence auprès de TMDB.

## 2. Développement local

```bash
npm install
cp .env.example .env      # puis collez votre clé dans TMDB_API_KEY
npm run dev               # http://localhost:5173
```

Sans clé, le site s'affiche quand même mais indique « La clé TMDB n'est pas encore configurée ».

## 3. Où vit la clé API (et pourquoi)

Un site React est du JavaScript exécuté **dans le navigateur du visiteur** : toute variable `VITE_*` est
recopiée en clair dans le bundle et lisible par n'importe qui (onglet Réseau, code source). La clé n'est
donc **jamais** côté client :

```
Navigateur ──► /api/tmdb.php?path=/movie/550 ──► api.themoviedb.org/3/movie/550?api_key=…
                (même domaine, sans clé)            (la clé est ajoutée ici, sur le serveur)
```

- **En développement**, `/api/tmdb.php` est servi par un middleware Vite (`server/tmdb-dev-proxy.ts`) qui lit
  `TMDB_API_KEY` dans `.env`. Pas de préfixe `VITE_` → la variable ne quitte pas Node.
- **En production**, `public/api/tmdb.php` fait le même travail sur LWS. Il cherche la clé, dans l'ordre :
  1. la variable d'environnement `TMDB_API_KEY` ;
  2. **`tmdb-config.php` placé un niveau au-dessus du dossier web** (méthode recommandée) ;
  3. `api/tmdb-config.php` (repli, accès HTTP bloqué par `api/.htaccess`).

Le proxy n'accepte qu'une liste blanche d'endpoints et de paramètres en lecture seule (impossible de s'en
servir pour autre chose que ce site), force `include_adult=false`, et met les réponses en cache 15 min sur le
serveur pour rester sous les limites de débit de TMDB.

`.env`, `.env.deploy` et `tmdb-config.php` sont exclus par `.gitignore`.

## 4. Build

```bash
npm run build     # vérification TypeScript + build optimisé dans dist/
npm run preview   # sert dist/ avec les mêmes en-têtes de sécurité (CSP) que la prod
```

## 5. Déploiement sur LWS

Arborescence attendue sur l'hébergement (le dossier web s'appelle généralement `htdocs` chez LWS —
vérifiez dans votre espace client) :

```
/                         ← racine FTP (non publique)
├── tmdb-config.php       ← votre clé, hors d'atteinte depuis Internet
├── cineyast-cache/       ← créé automatiquement par le proxy
└── htdocs/               ← contenu de dist/
    ├── .htaccess
    ├── index.html
    ├── assets/…
    └── api/
        ├── .htaccess
        └── tmdb.php
```

**Première mise en ligne**

1. Espace client LWS : vérifiez que **PHP ≥ 7.4** est actif (8.x recommandé) et activez le **certificat SSL
   Let's Encrypt** gratuit pour cineyast.com.
2. Copiez `deploy/tmdb-config.example.php` en `deploy/tmdb-config.php` et collez-y votre clé.
3. Envoyez les fichiers, au choix :
   - **FileZilla** : tout le contenu de `dist/` (fichiers cachés inclus, notamment `.htaccess`) dans `/htdocs`,
     et `deploy/tmdb-config.php` à la racine FTP ;
   - **ou le script** : copiez `.env.deploy.example` en `.env.deploy`, renseignez vos accès FTP, puis
     ```bash
     npm run build
     npm run deploy -- --config
     ```
4. Testez le proxy : <https://cineyast.com/api/tmdb.php?path=/genre/movie/list> doit renvoyer la liste des genres en JSON.
5. Une fois le HTTPS fonctionnel, décommentez les 3 lignes « HTTPS forcé » de `public/.htaccess` et redéployez.

**Mises à jour suivantes** : `npm run build && npm run deploy` (la clé reste en place sur le serveur).

## 6. Attribution TMDB

Le pied de page affiche la mention exigée : « Ce produit utilise l'API TMDB mais n'est pas approuvé ou
certifié par TMDB », avec un lien vers themoviedb.org. Les conditions TMDB demandent aussi d'afficher leur
**logo officiel**, moins proéminent que le vôtre : téléchargez-le sur
<https://www.themoviedb.org/about/logos-attribution> et ajoutez-le dans `src/components/layout/Footer.tsx`
(pensez à le placer dans `public/`, la CSP n'autorise que les images locales et TMDB).

## Structure

```
src/
├── components/
│   ├── ui/          composants 21st.dev adaptés (hero, rating, ticket, chips, scroller…)
│   ├── movie/       carte, affiche, rangée, grille, bande-annonce, bouton favori
│   ├── explore/     panneau de filtres
│   └── layout/      en-tête, pied de page, logo, page d'erreur
├── hooks/           requêtes TMDB, favoris (localStorage), utilitaires
├── lib/             client TMDB typé, formatage FR, slugs
└── pages/           Accueil, Explorer, Fiche film, Favoris, 404
server/              proxy TMDB de développement + CSP partagée
public/              .htaccess (SPA, cache, sécurité), api/tmdb.php (proxy de prod)
```

## Pistes pour la v2

- Plateformes de streaming en France (`/movie/{id}/watch/providers`, attribution JustWatch requise)
- Pages acteurs et réalisateurs (filmographies)
- Pré-rendu des fiches pour le SEO et le partage sur les réseaux sociaux
