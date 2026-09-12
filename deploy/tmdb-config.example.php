<?php
/**
 * Modèle de configuration de la clé TMDB pour la production.
 *
 * 1. Copiez ce fichier sous le nom  tmdb-config.php
 * 2. Collez votre clé TMDB (clé API v3 OU jeton d'accès en lecture v4)
 * 3. Envoyez-le par FTP UN NIVEAU AU-DESSUS du dossier web, par exemple :
 *
 *      /tmdb-config.php        ← ici (inaccessible depuis Internet)
 *      /htdocs/index.html
 *      /htdocs/api/tmdb.php
 *
 * Ne le commitez jamais (il est exclu par .gitignore).
 */
return [
    'api_key' => 'COLLEZ_VOTRE_CLE_TMDB_ICI',
];
