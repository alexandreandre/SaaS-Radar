# Référence technique — connecteurs SaaS-Radar

Document complémentaire au skill `/connector`. Lire **uniquement** pendant
l'implémentation.

---

## Arborescence cible (connecteur metrics cockpit)

```
src/lib/connectors/{id}/
├── index.ts
├── types.ts
├── client.ts
├── oauth.ts          # si OAuth
├── keys.ts           # si clé API utilisateur
├── analytics.ts      # optionnel
├── metrics.ts
├── snapshots.ts
└── sync-service.ts

src/app/api/connectors/{id}/
├── connect/route.ts
├── sync/route.ts
├── disconnect/route.ts
├── oauth/route.ts    # si OAuth
├── callback/route.ts # si OAuth
└── accounts/route.ts # si multi-comptes

src/components/cockpit/integrations/
└── {id}-connect-dialog.tsx

scripts/{id}-connector.test.ts
supabase/migrations/NNN_{id}_connector.sql
```

---

## Template route `connect/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { {Id}ConnectorError } from "@/lib/connectors/{id}/client";
import { run{Id}Sync, save{Id}Credential } from "@/lib/connectors/{id}/sync-service";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!isCredentialsEncryptionConfigured()) {
    return NextResponse.json(
      { error: "Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY)" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "";
  // + champs credential spécifiques

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    // parse credential → save{Id}Credential → run{Id}Sync
    const sync = await run{Id}Sync(user.id, projectId);
    return NextResponse.json({
      accountLabel: sync.accountLabel,
      snapshots: sync.snapshots,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
    });
  } catch (err) {
    const status = err instanceof {Id}ConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
```

`sync/route.ts` : même garde-fous, corps `{ projectId }`, appelle `run{Id}Sync`
sans re-saisie credential.

`disconnect/route.ts` : `deleteConnectorCredential(userId, projectId, "{id}")`.

---

## Template OAuth

### `oauth/route.ts` (GET)

```typescript
// 1. getCurrentUser → 401
// 2. projectId query → assertProjectOwnedByUser
// 3. is{Id}Configured() → 503 si vars manquantes
// 4. state = base64url(JSON.stringify({ projectId, userId: user.id }))
// 5. redirect 302 vers authorize URL officielle
```

### `callback/route.ts` (GET)

```typescript
// 1. code + state query params
// 2. decode state, vérif userId === current user
// 3. exchange code → tokens
// 4. save{Id}OAuthCredential (refresh token, access, expiry)
// 5. redirect /cockpit/...?...{id}_oauth=1
```

Redirect URI plateforme : `https://<domaine>/api/connectors/{id}/callback`

Variables env : `{ID}_CLIENT_ID`, `{ID}_CLIENT_SECRET`, `{ID}_REDIRECT_URI`

---

## Template `sync-service.ts`

```typescript
import "server-only";

import {
  loadConnectorCredential,
  saveConnectorCredential,
  deleteConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { fetch{Id}ConnectorSync } from "@/lib/connectors/{id}/metrics";
import type { {Id}Credential } from "@/lib/connectors/{id}/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function load{Id}Credential(userId: string, projectId: string) {
  const stored = await loadConnectorCredential<{Id}Credential>(userId, projectId, "{id}");
  return stored?.data ?? null;
}

export async function run{Id}Sync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await load{Id}Credential(userId, projectId);
  if (!credential) throw new Error("{Nom} non connecté pour ce projet");

  const result = await fetch{Id}ConnectorSync(credential);

  // Si tokens rafraîchis dans result.updatedCredential :
  // await saveConnectorCredential(...)

  return { ...result, accountLabel: result.accountLabel ?? "Compte" };
}

export async function disconnect{Id}(userId: string, projectId: string) {
  await deleteConnectorCredential(userId, projectId, "{id}");
}
```

---

## Template `snapshots.ts` (fonctions pures — priorité tests)

```typescript
import type { MetricsSnapshot } from "@/lib/connectors/types";

export function mapApiRowsToSnapshots(rows: ApiRow[]): MetricsSnapshot[] {
  return rows.map((row) => ({
    date: normalizeMonthDate(row.period), // YYYY-MM-DD
    mrr: 0,
    newMrr: 0,
    expansionMrr: 0,
    churnedMrr: 0,
    customers: 0,
    signups: 0,
    trials: 0,
    activeUsers: 0,
    mau: 0,
    dau: 0,
    adSpend: convertSpend(row.cost),
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
    conversions: row.conversions ?? 0,
    source: "{id}",
  }));
}
```

**Règles :**

- Toujours renseigner **tous** les champs `MetricsSnapshot`
- Conversions monétaires explicites (centimes → euros, micros → unités)
- `source` = `ConnectorId` exact
- Agrégation mensuelle : une ligne par mois, dates au 1er du mois si pertinent

---

## Template test `scripts/{id}-connector.test.ts`

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapApiRowsToSnapshots,
  normalizeResourceId,
  buildMetricsQuery,
} from "../src/lib/connectors/{id}/snapshots.ts";

describe("{id} connector — parsing", () => {
  it("normalizes resource ids", () => {
    assert.equal(normalizeResourceId("accounts/123"), "123");
  });
});

describe("{id} connector — snapshot mapping", () => {
  it("maps API rows to metrics snapshots", () => {
    const snapshots = mapApiRowsToSnapshots([/* fixtures */]);
    assert.equal(snapshots[0]!.source, "{id}");
    // assertions métriques
  });
});
```

Ajouter dans `package.json` :

```json
"test": "... && tsx scripts/{id}-connector.test.ts"
```

---

## Migration SQL provider

```sql
-- NNN_{id}_connector.sql
ALTER TABLE connector_credentials
  DROP CONSTRAINT IF EXISTS connector_credentials_provider_check;

ALTER TABLE connector_credentials
  ADD CONSTRAINT connector_credentials_provider_check
  CHECK (provider IN (
    'github', 'vercel', 'netlify', 'stripe', 'google-ads', '{id}'
  ));
```

Mettre à jour `ConnectorProvider` dans `credentials-store.ts` en sync.

---

## Registry `makeConnector`

```typescript
makeConnector({
  id: "{id}",
  name: "{Nom affiché}",
  category: "ads", // payments | ads | analytics | email | support | ...
  jobLabel: "Acquérir", // voir CONNECTOR_JOB_LABELS
  priority: "p1", // p0 | p1 | p2
  recommendedFor: ["tag-fiche"], // optionnel
  cockpitImpact: "Texte impact cockpit", // optionnel
  description: "Une phrase claire pour le marketplace.",
  provides: ["adSpend", "impressions", "clicks", "conversions"],
  demoFields: ["adSpend", "impressions", "clicks", "conversions"],
})
```

`makeStreamOnlyConnector` : pas de `provides` ni snapshots — catégories dev,
finance, monitoring, etc.

---

## `CONNECTOR_BRANDS`

```typescript
"{id}": {
  icon: "SiMeta", // slug Simple Icons OU clé locale
  source: "simple-icons", // ou "local"
  color: "#0668E1", // hex officiel marque
},
```

Vérifier que l'icône existe dans `connector-brand-icons.tsx` ou ajouter asset
local dans `connector-local-icons.tsx`.

---

## Portfolio context — branches type

```typescript
// ConnectIntegrationOptions
export type ConnectIntegrationOptions = {
  mode?: "demo" | "real";
  secretKey?: string;       // Stripe-like
  customerId?: string;      // Google Ads-like
  // + champs spécifiques {id}
};

// connectIntegration
if (connectorId === "{id}" && options?.mode === "real") {
  const res = await fetch("/api/connectors/{id}/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, ...options }),
  });
  // applyConnectorSyncToProject(...)
  return;
}
```

---

## `integration-card.tsx` — pattern

```typescript
const is{Id} = connector.id === "{id}";

// Connecté réel vs démo
const isConnected =
  is{Id} ? isRealConnected : isDemo || isRealConnected;

// OAuth callback
useEffect(() => {
  if (is{Id} && searchParams.get("{id}_oauth") === "1") {
    set{Id}DialogOpen(true);
  }
}, [is{Id}, searchParams]);

// Bouton connecter
{is{Id} ? (
  <Button onClick={() => set{Id}DialogOpen(true)}>Connecter</Button>
) : (
  // démo ou autre
)}
```

---

## Variables `.env.example` — conventions

| Pattern | Usage |
|---------|-------|
| `CREDENTIALS_ENCRYPTION_KEY` | Obligatoire tous connecteurs réels |
| `{SNAKE}_CLIENT_ID/SECRET/REDIRECT_URI` | OAuth plateforme |
| `{SNAKE}_DEVELOPER_TOKEN` / clés API plateforme | Si requis par le fournisseur |
| `{ID}_CONNECTOR_TEST_*` | Vars CI commentées |
| `{ID}_CONNECTOR_FALLBACK=1` | Dev uniquement, sync dégradée |

Redirect URI commentée : `https://<domaine>/api/connectors/{id}/callback`

---

## Références implémentées (à lire avant de coder)

| Connecteur | Auth | Fichiers clés |
|------------|------|---------------|
| Stripe | Clé restreinte `rk_*` | `keys.ts`, `v1-metrics.ts` (API v1 MRR), `analytics.ts` (probe + bonus `2026-04-22.preview`), `metrics.ts` stream |
| Google Ads | OAuth + GAQL v24 | `oauth.ts`, `client.ts`, `snapshots.ts` (12 mois) |
| GitHub | App install | `api/connectors/github/` — build, pas metrics |
| Vercel | OAuth | `api/connectors/vercel/` — build |

---

## Checklist fichiers modifiés (récap exhaustive)

**Toujours vérifier si déjà présent avant création.**

| Fichier | Action |
|---------|--------|
| `src/lib/connectors/types.ts` | `ConnectorId` |
| `src/lib/connectors/brands.ts` | brand |
| `src/lib/connectors/registry.ts` | entrée + demoFields |
| `src/lib/connectors/credentials-store.ts` | `ConnectorProvider` |
| `src/lib/connectors/{id}/**` | nouveau module |
| `src/app/api/connectors/{id}/**` | routes |
| `src/components/cockpit/integrations/{id}-connect-dialog.tsx` | UI |
| `src/components/cockpit/integrations/integration-card.tsx` | branches |
| `src/contexts/portfolio-context.tsx` | connect/sync/disconnect |
| `scripts/{id}-connector.test.ts` | tests |
| `package.json` | script test |
| `.env.example` | vars |
| `README.md` | setup console |
| `supabase/migrations/NNN_{id}_connector.sql` | provider check |
| `src/app/api/admin/system/route.ts` | health optionnel |

---

## Recherche API — requêtes web types

Pour chaque nouveau connecteur, chercher :

1. `{Product} API authentication 2025 2026`
2. `{Product} API rate limits pagination`
3. `{Product} API metrics reporting monthly` (adapter selon catégorie)
4. `{Product} OAuth scopes minimum`
5. `{Product} sandbox test account`

Documenter la **version** explicitement utilisée dans le code (constante ou
header `API-Version`).

---

## Anti-patterns observés à éviter

| Anti-pattern | Correct |
|--------------|---------|
| Sync via `syncConnectorReal` stub | Routes `/api/connectors/{id}/sync` |
| Secret en variable env utilisateur | Credential chiffrée par projet |
| Snapshots partiels (champs manquants) | Tous champs `MetricsSnapshot` |
| Tests avec appels réseau CI | Fonctions pures `snapshots.ts` |
| OAuth sans vérif state userId | Décoder state, comparer `userId` |
| Oublier `removeConnectorStream` à disconnect | `disconnectIntegration` |
