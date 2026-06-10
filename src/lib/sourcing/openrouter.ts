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

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${model} HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
      cost?: number;
    };
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  const u = data.usage ?? {};

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
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // suite
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      // suite
    }
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(trimmed.slice(first, last + 1));
    } catch {
      // suite
    }
  }

  throw new Error("Réponse OpenRouter non parsable en JSON");
}

/**
 * Vérifie que les slugs de modèles sont actifs sur OpenRouter.
 * Lève une erreur explicite (avec le slug manquant) sinon.
 */
export async function assertModelsActive(models: string[]): Promise<void> {
  const res = await fetch(`${OPENROUTER_BASE}/models`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
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
