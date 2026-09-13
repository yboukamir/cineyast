# Données de test

Réponses réelles de l'API TMDB, enregistrées le 2026-09-13 par `npm run fixtures` — aucune donnée inventée.
Données fournies par [The Movie Database (TMDB)](https://www.themoviedb.org/) ; offres de streaming : JustWatch.

| Fichier | Requête | Cas couvert |
| --- | --- | --- |
| `tmdb/movie-550.json` | `/movie/550` | Fight Club : location et achat identiques, bande-annonce, classification FR |
| `tmdb/movie-496243.json` | `/movie/496243` | Parasite : location et achat différents, pas d'abonnement |
| `tmdb/person-287.json` | `/person/287` | Brad Pitt : acteur, apparitions « Self » et rôle à son propre nom |
| `tmdb/person-7467.json` | `/person/7467` | David Fincher : réalisateur, crédits « Thanks » et postes techniques |
| `tmdb/person-21684.json` | `/person/21684` | Bong Joon-ho : réalisateur, scénario, films sans date |
| `tmdb/person-55936.json` | `/person/55936` | Jemaine Clement : biographie française absente |
| `tmdb/person-1126.json` | `/person/1126` | Krzysztof Kieślowski : nom en latin étendu |
| `tmdb/person-8193.json` | `/person/8193` | Florian Henckel von Donnersmarck : nom de 32 caractères |
| `tmdb/person-69759.json` | `/person/69759` | Apichatpong Weerasethakul : nom de 25 caractères (palier de taille intermédiaire) |
| `index.html` | page de production | HTML enrichi par `api/share.js` |
