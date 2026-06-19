# Connecteur GitHub (`github`)

Connecteur **stream-only** : alimente `connectorStreams.github` (`GitHubMultiStream`) avec commits, CI, issues et PRs **par dépôt suivi**.

## Modèle multi-repo

- **1 installation GitHub App** par projet cockpit
- **Jusqu'à 5 dépôts** suivis en parallèle (`githubTrackedRepos`)
- Chaque dépôt a son `DevStream` dans `GitHubMultiStream.repos`
- Lien optionnel vers un **outil Build** (`linkedToolId`) — auto-lié à l'ajout depuis le module Build
- Un dépôt peut être marqué **principal** (`isPrimary`) pour les agrégats et le match Vercel

## Prérequis

1. Compte GitHub avec droits d'installation d'apps sur l'org ou le compte cible.
2. Variables serveur (voir `.env.example`) :
   - `GITHUB_APP_ID`
   - `GITHUB_APP_PRIVATE_KEY` (PEM ou base64)
   - `GITHUB_APP_SLUG`
   - `CREDENTIALS_ENCRYPTION_KEY`

## Créer la GitHub App

1. **GitHub** → Settings → Developer settings → **GitHub Apps** → New GitHub App
2. **Callback URL** : `https://<domaine>/api/connectors/github/callback`
3. **Permissions** (Repository, lecture) :
   - Metadata
   - Contents
   - Actions
   - Pull requests
   - Issues (optionnel si `open_issues_count` suffit)
4. **Where can this GitHub App be installed?** : Any account
5. Générer une **clé privée** → `GITHUB_APP_PRIVATE_KEY`
6. Noter l'**App ID** et le **slug** (URL `github.com/apps/<slug>`)

## Flux utilisateur

1. **Installer l'app** → `GET /api/connectors/github/oauth?projectId=`
2. Callback → stocke `installationId` chiffré → redirect `?github_oauth=1`
3. **Liste des dépôts** → `GET /api/connectors/github/repos?projectId=` (inclut `tracked`)
4. **Ajouter un dépôt** → `POST /api/connectors/github/connect` `{ projectId, repoFullName, linkedToolId?, setPrimary? }`
5. **Sync** → `POST /api/connectors/github/sync` `{ projectId, repoFullName? }` (tous ou un seul)
6. **Retirer un dépôt** → `POST /api/connectors/github/repos/remove` `{ projectId, repoFullName }`
7. **Définir principal** → `PATCH /api/connectors/github/repos/primary` `{ projectId, repoFullName }`
8. **Lier / délier outil Build** → `PATCH /api/connectors/github/repos/link` `{ projectId, repoFullName, linkedToolId | null }`
9. **Disconnect total** → `POST /api/connectors/github/disconnect` `{ projectId }`

Accessible depuis le **module Build** et le **marketplace Intégrations** (même dialog de gestion).

## Credential chiffrée

```json
{
  "installationId": 12345678,
  "trackedRepos": [
    {
      "repoFullName": "acme/lovable-export",
      "linkedToolId": "lovable",
      "isPrimary": false,
      "addedAt": "2026-06-18T10:00:00.000Z"
    },
    {
      "repoFullName": "acme/emergent-export",
      "linkedToolId": "emergent",
      "isPrimary": false,
      "addedAt": "2026-06-18T10:30:00.000Z"
    },
    {
      "repoFullName": "acme/codex-mvp",
      "linkedToolId": "codex",
      "isPrimary": false,
      "addedAt": "2026-06-18T10:45:00.000Z"
    },
    {
      "repoFullName": "acme/saas-radar",
      "linkedToolId": "cursor",
      "isPrimary": true,
      "addedAt": "2026-06-18T11:00:00.000Z"
    }
  ]
}
```

**Rétrocompat** : les credentials legacy `{ installationId, repoFullName }` sont migrés à la lecture en `trackedRepos[0]` avec `isPrimary: true`.

## Stream cockpit

```json
{
  "type": "github",
  "primaryRepoFullName": "acme/saas-radar",
  "lastSyncedAt": "2026-06-18T12:00:00.000Z",
  "repos": {
    "acme/saas-radar": { "type": "dev", "commitsLast7d": 5, "...": "..." },
    "acme/lovable-export": { "type": "dev", "commitsLast7d": 2, "...": "..." }
  }
}
```

Les anciens streams `type: "dev"` seuls sont wrappés automatiquement par les helpers `normalizeGitHubStreamPayload`.

## API GitHub utilisée

- Version : `2022-11-28` (`X-GitHub-Api-Version`)
- `GET /repos/{owner}/{repo}` — métadonnées
- `GET /repos/{owner}/{repo}/pulls?state=open` — PRs
- `GET /repos/{owner}/{repo}/stats/participation` — commits (retry si 202)
- `GET /repos/{owner}/{repo}/actions/runs` — CI (paginé, 30 jours)
- `GET /repos/{owner}/{repo}/traffic/views` — vues (0 si analytics désactivé)

## Tests locaux (optionnel)

```bash
# GITHUB_CONNECTOR_TEST_INSTALLATION_ID=
# GITHUB_CONNECTOR_TEST_REPO=owner/repo
npm test -- scripts/github-connector.test.ts
```

Les tests CI couvrent les fonctions pures (`streams.ts`, `normalize.ts`, helpers multi-stream).
