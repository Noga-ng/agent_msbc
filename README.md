# agent_msbc — espace agents de terrain

Application React 19 + TypeScript + Vite pour les inscriptions MSBC. **Le backend et sa base de données ne sont pas fournis dans cette archive.** Les données de production sont servies par l'API externe.

## Installation

- Node.js **22.22.0 ou supérieur** et npm 10+ ; connecter le backend autorisé via HTTPS.
- `cp .env.example .env`, puis configurer `VITE_API_URL` (valeur publique).
- `npm ci`, `npm run lint`, `npm test`, `npm run build`, `npm run dev`.
- Les données du dashboard, du répertoire et du compte viennent exclusivement de l'API PHP : aucun mode `local`, aucun brouillon `localStorage`. L'état React des formulaires n'est conservé que le temps de l'affichage.
- Ne placer **aucun secret** dans les variables `VITE_*` : Vite les expose au navigateur.

## Parcours

- Publics : `/`, `/login`.
- Authentifiés : `/dashboard`, `/inscription`, `/membres`, `/membres/:id`, `/compte`.
- Ajouts familiaux depuis la fiche du titulaire : `/membres/:id/ajouter-conjoint`, `/membres/:id/ajouter-enfant`. Un GET du titulaire vérifie sa présence et sa catégorie avant d'afficher les formulaires. **L'autorisation réelle doit rester vérifiée côté serveur.**
- Les anciens parcours `/inscription/conjoint`, `/inscription/enfants` et `/membres/edit` ne sont plus utilisés.
- L'édition et la suppression des membres restent indisponibles sans endpoint dédié. La mise à jour du profil appelle `PUT /auth/profile` (configurable), et le changement de mot de passe appelle `POST /auth/change-password` : le frontend exige `status:true` du serveur pour confirmer une modification. Voir `DOCS/API_PHP_INTEGRATION.md`.
- La liste des membres comporte désormais une recherche réactive (nom, prénom, CIN, identifiant, téléphone, etc.), un filtre de statut, un état vide et un bouton « Actualiser ». La recherche filtre seulement les membres renvoyés par l'API de l'agent ; elle n'est **pas** une recherche SQL globale.
- Navigation responsive avec tiroir Framer Motion, surbrillance de la page active, fermeture par Échap et overlay, indicateur de session et animations réduites si l'accessibilité le demande.
- Loaders accessibles pour session, membres, fiches et statistiques ; indicateurs de soumission dans les formulaires.

## Contrat API actuel (à confirmer avec le backend)

| Méthode | Route | Utilisation |
|---|---|---|
| POST | `/connection` | login, cookie de session |
| GET | `/auth/session` | session courante |
| POST | `/auth/logout` | révocation de session |
| GET | `/recuperationMembres/:agentId` | membres/statistiques de l'agent |
| GET | `/membres/:id` | titulaire et famille |
| POST | `/insertMembres` | création du titulaire |
| POST | `/insertMembres/conjoint` | création d'un conjoint |
| POST | `/insertMembres/enfants` | création d'un enfant |
| PUT | `/auth/profile` | mise à jour du profil (backend à confirmer) |
| POST | `/auth/change-password` | modification du mot de passe (backend à confirmer) |

Les réponses de ces appels sont supposées suivre `{ status: boolean, message: string, data: ... }`. Les requêtes utilisent `credentials: include`. L'API **doit** valider l'identité de l'agent à partir de la session, contrôler les droits sur le titulaire et chaque fiche, appliquer une validation indépendante et la politique CSRF adaptée aux cookies. Le champ `users` fourni historiquement par le frontend n'est pas une preuve d'identité.

## Déploiement Apache / cPanel

Déployer les fichiers produits dans `dist/`, y compris la règle SPA de `public/.htaccess` (copiée par Vite). Tester une ouverture et une actualisation directes de `/membres/:id`. Le site privé est `noindex`, ne pas publier de sitemap du profil. La politique HTTPS/CORS/SameSite du cookie est configurée côté serveur.

## État de validation

**13 tests automatisés réussis**, contrôle TypeScript (`tsc -b`) et ESLint réussis dans l'environnement d'audit. La construction Vite n'a pas été validée : son binaire Rolldown natif optionnel est manquant dans le `node_modules` partiel et Node local est en version 22.16 (inférieure au minimum requis 22.22). Relancer une installation fraîche `npm ci` et `npm run build` avec Node conforme avant déploiement. Les tests E2E et l'intégration PHP restent à réaliser avec l'API réelle.

## Corrections des inscriptions — 22/10/2026

Les parcours titulaire, conjoint et enfant utilisent maintenant une validation commune par étape, un POST PHP unique par inscription, et des erreurs serveur explicites. Voir `AUDIT_CORRECTIONS_INSCRIPTIONS_2026-10-22.md` pour les changements et les responsabilités du backend. Les données ne sont jamais sauvées en stockage navigateur : la saisie n'existe que dans l'état temporaire du formulaire.

## Modification des fiches membres (nouveau)

Depuis `/membres/:id`, les boutons **Modifier** ouvrent les formulaires du titulaire, du conjoint et de chaque enfant. Le formulaire réutilise les contrôles des inscriptions et envoie les **seuls champs modifiés** aux endpoints PHP configurables ; les données inchangées et la photo existante sont conservées. Pour configurer les routes PHP de mise à jour, voir `DOCS/API_PHP_INTEGRATION.md` et `.env.example`. Les endpoints de modification ne sont pas présents dans l'archive frontend et doivent exister côté serveur.
