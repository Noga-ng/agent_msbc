# Contrats PHP utilisés par `agent_msbc` (22 octobre 2026)

Le frontend n'intègre **aucun serveur PHP**. Toutes les données métier proviennent des réponses de l'API configurée par `VITE_API_URL`. Le code ne lit et n'écrit plus `localStorage`, `sessionStorage`, `IndexedDB`, ni un mode de démonstration local. Un état React temporaire pendant le remplissage d'un formulaire ou le filtrage d'une réponse API n'est **pas** une base de données locale.

## Routes déjà appelées par la version reçue

| HTTP | Chemin | Contrat attendu |
| --- | --- | --- |
| POST | `/connection` | Établit la session avec cookie `HttpOnly`; `{status:true,...}` |
| GET | `/auth/session` | `{status:true,data:{id,cin,noms,prenoms,telephone,fonction,description,photo,csrfToken?}}` |
| POST | `/auth/logout` | `{status:true}` après révocation serveur |
| GET | `/recuperationMembres/:agentId` | `{status:true,data:[...]}` ; la recherche et les filtres interrogent **uniquement cette réponse** déjà chargée |
| GET | `/membres/:id` | `{status:true,data:{titularies,conjoint,enfants}}` |
| POST | `/insertMembres` | Inscription d'un titulaire via `multipart/form-data` |
| POST | `/insertMembres/conjoint` | Inscription d'un conjoint |
| POST | `/insertMembres/enfants` | Inscription d'un enfant |

## Endpoints de modification de compte **à fournir côté PHP**

### `PUT /auth/profile`

Le chemin est modifiable via `VITE_PROFILE_UPDATE_ENDPOINT` (défaut : `/auth/profile`). Corps JSON :

```json
{
  "noms": "RAKOTO",
  "prenoms": "Soa",
  "telephone": "0341234567",
  "fonction": "Agent",
  "description": "...",
  "photo": "data:image/jpeg;base64,..."
}
```

Le backend doit identifier le compte **par la session** et ne pas accepter d'ID de compte arbitraire du client. Valider les longueurs et formats, la taille des images, les champs modifiables (notamment le rôle `fonction`), et les autorisations. Le champ `fonction` devrait être ignoré/refusé si seuls les administrateurs peuvent le modifier. Répondre `{ "status": true, "message": "..." }` uniquement **après commit en base**. En cas d'échec, répondre avec HTTP 4xx/5xx et `{ "status": false, "message": "..." }`. `GET /auth/session` doit refléter les valeurs sauvegardées : l'interface le rappelle après succès.

**Important :** aucun fichier PHP fourni ne permet d'affirmer que cet endpoint est actuellement disponible. En cas de 404/405, le frontend affiche un message d'échec ; il ne simule pas d'enregistrement.

### `POST /auth/change-password`

Chemin modifiable via `VITE_PASSWORD_CHANGE_ENDPOINT`. JSON `{ "currentPassword":"...", "newPassword":"..." }`; le serveur doit vérifier l'ancien mot de passe (hachage sûr), la politique de mot de passe, la session et l'anti-CSRF, puis invalider les sessions requises. Réponse `{ "status": true }` uniquement après mise à jour. Codes d'erreur recommandés : `INVALID_CURRENT_PASSWORD`, `PASSWORD_REUSED`, `PASSWORD_TOO_WEAK`. Aucun secret n'est conservé dans le navigateur.

## Exigences serveur

- Cookie sécurisé `HttpOnly`, `Secure`, `SameSite` adapté au contexte des sous-domaines, et CORS avec origine explicite + `Access-Control-Allow-Credentials` pour les requêtes cross-origin.
- Défense CSRF pour les opérations mutantes (une session par cookie seule ne garantit pas cette protection). Le frontend peut envoyer `X-CSRF-Token` pour le changement de mot de passe si le token figure dans la session. Pour le profil et les autres mutations, vérifier avec le backend si une protection CSRF supplémentaire est exigée.
- Autorisation **côté serveur** sur chaque ressource et chaque agent. Ne pas faire confiance à `:agentId`, `:id`, `users`, `idTitulaire` ou `fonction` envoyés par le navigateur.
- Pagination ou recherche serveur à envisager si le nombre d'inscrits devient important : la recherche actuelle filtre la liste retournée par l'API, sans requête de recherche supplémentaire. Si l'API ne renvoie qu'une page, la recherche reste limitée à cette page.
- Vérifier les traitements PHP en situation réelle : compte actif, compte expiré, 401, 403, 404, 422, 429, 500 et déconnexion.

## Édition des titulaires, conjoints et enfants (frontend ajouté)

Les boutons **Modifier** de `/membres/:id` ouvrent les routes protégées :

| Type | Route React | Appel PHP POST `multipart/form-data` (valeur par défaut) |
| --- | --- | --- |
| Titulaire | `/membres/:id/modifier` | `/updateMembres` |
| Conjoint | `/membres/:id/modifier-conjoint/:personId` | `/updateMembres/conjoint` |
| Enfant | `/membres/:id/modifier-enfant/:personId` | `/updateMembres/enfants` |

Les chemins PHP sont **une convention de nouvelle intégration**, pas des routes vérifiées sur un backend fourni. S'ils sont différents sur le serveur existant, les régler avec `VITE_MEMBER_UPDATE_TITULAIRE_ENDPOINT`, `VITE_MEMBER_UPDATE_CONJOINT_ENDPOINT` et `VITE_MEMBER_UPDATE_ENFANT_ENDPOINT` avant `npm run build`. Les chemins doivent être relatifs à `VITE_API_URL`. Un segment `{id}` dans la variable est remplacé par l'identifiant URL-encodé du membre.

**Lecture avant édition :** le frontend appelle le `GET /membres/:id` déjà utilisé dans la fiche familiale. Pour éviter de demander à l'agent de ressaisir les données, PHP doit fournir pour *chaque personne* les propriétés enregistrées nécessaires au formulaire : `identifiant`, `noms`, `prenoms`, `naissance` (`YYYY-MM-DD`), `genre` (`femme`/`homme`), `lieu`, `profession`, `photo` (nom ou URL), `origine`, `telephone`, `telephone2`, `famille`, `cin`, `delivrance`. Pour le titulaire, fournir également `categorie` (5 à 8 ou libellé correspondant), `adresse`, `arrondissement`, `district`, `region`. Le tableau `enfants` doit contenir les enregistrements individuels avec leurs identifiants, pas un simple décompte. `Conjoint` doit avoir son propre `identifiant`.

**Écriture :** le frontend soumet un `FormData` par **POST** (PHP natif reçoit `$_POST` et `$_FILES`). Chaque requête inclut `identifiant` (celui de la personne modifiée) et, pour conjoint/enfant, `idTitulaire` (celui de la fiche parente), puis seulement les champs **modifiés**. Une photo n'est envoyée que si une autre photo est sélectionnée. Exemple de mise à jour partielle d'un enfant :

```text
POST /updateMembres/enfants
Content-Type: multipart/form-data; boundary=...
Cookie: session=... (automatique, HttpOnly)
X-CSRF-Token: ... (si la session le fournit)

identifiant=ENF123
idTitulaire=399248485095
telephone=0341234567
```

Réponses attendues : `200 OK` avec `{"status":true,"message":"Membre modifié"}` **uniquement après succès de la transaction**, sinon réponse 401/403/404/409/422/429/500 avec `{"status":false,"message":"..."}`. Une 404/405 est affichée comme endpoint manquant. Aucun faux enregistrement local n'est effectué. Le serveur **doit** appliquer les autorisations par session (agent propriétaire ou rôle habilité), valider `identifiant` et `idTitulaire`, les formats des champs, les doublons et la taille/type des images. Ne pas déduire l'autorisation du seul identifiant transmis par le navigateur. N'accepter de modification des catégories que pour les rôles autorisés, selon les règles MSBC.

Les champs `id`, `identifiant`, `idTitulaire`, `status`, `users`, `createdAt` et la propriété de l'agent ne sont pas éditables depuis le formulaire. Dans le cas où le `GET` initial ne fournit pas tous les champs, le formulaire laisse ceux-ci vides et demande à l'utilisateur de compléter les champs obligatoires ; il **n'invente pas de données**. Les champs absents et inchangés ne sont pas effacés en base, sous réserve que l'endpoint mette en œuvre une mise à jour partielle (whitelist SQL), **pas un remplacement global**.

### Vérification d'intégration recommandée

Tester successivement : titulaire existant, conjoint rattaché, enfant parmi plusieurs enfants, photo conservée sans nouvel upload, photo remplacée, date invalide, CIN déjà attribué, ressource qui n'appartient pas à l'agent, session expirée, route API absente, réponse positive `status:true`, HTTP 500 et échec réseau. Vérifier en relisant la fiche depuis le serveur après chaque succès.
