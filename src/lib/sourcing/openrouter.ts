const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY manquant dans .env.local");
  }
  return key;
}

function baseHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    "X-Title": "SaaS-Radar Sourcing",
  };
}

export interface OpenRouterUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Coût natif OpenRouter en USD si disponible, sinon null. */
  costUsd: number | null;
}

export interface OpenRouterResult {
  content: string;
  usage: OpenRouterUsage;
}

const MAX_HTTP_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Délai avant retry : respecte Retry-After (s ou date HTTP) sinon backoff exponentiel + jitter. */
function retryDelayMs(res: Response | null, attempt: number): number {
  const header = res?.headers.get("retry-after");
  if (header) {
    const asSeconds = Number(header);
    if (Number.isFinite(asSeconds)) return Math.max(0, asSeconds * 1000);
    const asDate = Date.parse(header);
    if (!Number.isNaN(asDate)) return Math.max(0, asDate - Date.now());
  }
  const expo = BASE_BACKOFF_MS * 2 ** (attempt - 1);
  return expo + Math.floor(Math.random() * 250);
}

/**
 * fetch avec retry sur erreurs transitoires (429 + 5xx) et erreurs réseau.
 * Les autres statuts (4xx hors 429) sont renvoyés tels quels — non transitoires.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  label: string
): Promise<Response> {
  const debug = process.env.SOURCING_DEBUG === "1";
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_HTTP_ATTEMPTS; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(url, init);
    } catch (err) {
      lastError = err;
      if (attempt === MAX_HTTP_ATTEMPTS) break;
      const delay = retryDelayMs(null, attempt);
      if (debug) {
        console.log(
          `[DEBUG openrouter] ${label} erreur réseau (tentative ${attempt}/${MAX_HTTP_ATTEMPTS}), retry dans ${delay}ms : ${err instanceof Error ? err.message : err}`
        );
      }
      await sleep(delay);
      continue;
    }

    const transient = res.status === 429 || res.status >= 500;
    if (!transient || attempt === MAX_HTTP_ATTEMPTS) {
      return res;
    }

    const delay = retryDelayMs(res, attempt);
    if (debug) {
      console.log(
        `[DEBUG openrouter] ${label} HTTP ${res.status} (tentative ${attempt}/${MAX_HTTP_ATTEMPTS}), retry dans ${delay}ms`
      );
    }
    await sleep(delay);
  }

  throw new Error(
    `${label} : échec après ${MAX_HTTP_ATTEMPTS} tentatives — ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

/**
 * Format de réponse OpenRouter, configurable PAR APPEL.
 * - Omis (undefined) → 'text' côté API (cas Sonar/perplexity, qui rejette json_object).
 * - { type: "json_object" } → JSON forcé (cas Gemini, qui l'accepte).
 */
export type ResponseFormat = { type: "json_object" };

interface CallParams {
  model: string;
  system?: string;
  user: string;
  responseFormat?: ResponseFormat;
  temperature?: number;
}

export async function callOpenRouter(params: CallParams): Promise<OpenRouterResult> {
  const { model, system, user, responseFormat, temperature = 0.2 } = params;

  const messages: { role: string; content: string }[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    // Demande à OpenRouter de renvoyer le coût réel + tokens dans la réponse.
    usage: { include: true },
  };
  // N'envoie response_format QUE s'il est fourni (Sonar le rejette, on s'appuie sur extractJsonObject).
  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const res = await fetchWithRetry(
    `${OPENROUTER_BASE}/chat/completions`,
    {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(body),
    },
    `OpenRouter ${model}`
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${model} HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
      cost?: number;
    };
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  const finishReason = data.choices?.[0]?.finish_reason ?? "unknown";
  const u = data.usage ?? {};

  if (process.env.SOURCING_DEBUG === "1") {
    console.log("\n[DEBUG openrouter] ─────────────────────────────");
    console.log(`[DEBUG openrouter] model=${model} finish_reason=${finishReason}`);
    console.log(
      `[DEBUG openrouter] content length=${content.length} chars | ` +
        `tokens: prompt=${u.prompt_tokens ?? 0} completion=${u.completion_tokens ?? 0} total=${u.total_tokens ?? 0}`
    );
    console.log(`[DEBUG openrouter] raw HEAD (500):\n${content.slice(0, 500)}`);
    console.log(`[DEBUG openrouter] raw TAIL (500):\n${content.slice(-500)}`);
    console.log("[DEBUG openrouter] ─────────────────────────────\n");
  }

  return {
    content,
    usage: {
      promptTokens: u.prompt_tokens ?? 0,
      completionTokens: u.completion_tokens ?? 0,
      totalTokens: u.total_tokens ?? 0,
      costUsd: typeof u.cost === "number" ? u.cost : null,
    },
  };
}

/**
 * Extrait un objet JSON d'une réponse potentiellement verbeuse (Sonar surtout).
 * Tente : parse direct → bloc ```json → premier {...} équilibré.
 */
export function extractJsonObject(raw: string): unknown {
  const debug = process.env.SOURCING_DEBUG === "1";
  const trimmed = raw.trim();

  const tryParse = (label: string, text: string): unknown | null => {
    try {
      const parsed = JSON.parse(text);
      if (debug) console.log(`[DEBUG extractJsonObject] OK via ${label}`);
      return parsed;
    } catch (err) {
      if (debug) {
        console.log(
          `[DEBUG extractJsonObject] FAIL ${label}: ${err instanceof Error ? err.message : err}`
        );
      }
      return null;
    }
  };

  const direct = tryParse("direct parse", trimmed);
  if (direct !== null) return direct;

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    const fenced = tryParse("markdown fence", fence[1].trim());
    if (fenced !== null) return fenced;
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) {
    const sliced = tryParse(`brace slice [${first}..${last}]`, trimmed.slice(first, last + 1));
    if (sliced !== null) return sliced;
  }

  throw new Error("Réponse OpenRouter non parsable en JSON");
}

/**
 * Vérifie que les slugs de modèles sont actifs sur OpenRouter.
 * Lève une erreur explicite (avec le slug manquant) sinon.
 */
export async function assertModelsActive(models: string[]): Promise<void> {
  const res = await fetchWithRetry(
    `${OPENROUTER_BASE}/models`,
    { headers: { Authorization: `Bearer ${getApiKey()}` } },
    "OpenRouter /models"
  );
  if (!res.ok) {
    throw new Error(`Impossible de lister les modèles OpenRouter (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { data?: { id: string }[] };
  const ids = new Set((data.data ?? []).map((m) => m.id));
  const missing = models.filter((m) => !ids.has(m));
  if (missing.length > 0) {
    throw new Error(
      `Modèle(s) OpenRouter introuvable(s) : ${missing.join(", ")}. ` +
        `Vérifie les slugs sur https://openrouter.ai/models`
    );
  }
}

interface ModelStat {
  costUsd: number;
  tokens: number;
  costKnown: boolean;
  calls: number;
}

/** Cumule le coût réel + tokens par modèle sur l'ensemble du run. */
export class CostTracker {
  private stats = new Map<string, ModelStat>();

  add(label: string, usage: OpenRouterUsage): void {
    const cur =
      this.stats.get(label) ?? { costUsd: 0, tokens: 0, costKnown: false, calls: 0 };
    cur.tokens += usage.totalTokens;
    cur.calls += 1;
    if (usage.costUsd !== null) {
      cur.costUsd += usage.costUsd;
      cur.costKnown = true;
    }
    this.stats.set(label, cur);
  }

  totalCostUsd(): number {
    return Array.from(this.stats.values()).reduce((sum, s) => sum + s.costUsd, 0);
  }

  totalTokens(): { input: number; output: number } {
    const tokens = Array.from(this.stats.values()).reduce((sum, s) => sum + s.tokens, 0);
    return { input: tokens, output: 0 };
  }

  private stat(label: string): ModelStat {
    return this.stats.get(label) ?? { costUsd: 0, tokens: 0, costKnown: false, calls: 0 };
  }

  /** Ligne de synthèse coût pour la fin de run. */
  formatCostLine(): string {
    const sonar = this.stat("Sonar");
    const gemini = this.stat("Gemini");
    const allStats = Array.from(this.stats.values());
    const anyCostKnown = allStats.some((s) => s.costKnown);

    if (anyCostKnown) {
      const total = allStats.reduce((sum, s) => sum + s.costUsd, 0);
      return (
        `💰 Coût total du run: $${total.toFixed(4)} ` +
        `(Sonar: $${sonar.costUsd.toFixed(4)}, Gemini: $${gemini.costUsd.toFixed(4)})`
      );
    }

    return (
      `💰 Coût exact indisponible — tokens cumulés ` +
      `(Sonar: ${sonar.tokens} tokens / ${sonar.calls} appels, ` +
      `Gemini: ${gemini.tokens} tokens / ${gemini.calls} appels)`
    );
  }
}
