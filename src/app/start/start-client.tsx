"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  IdeaClarifyChat,
  type IdeaClarifyPrompt,
} from "@/components/start/idea-clarify-chat";
import { IdeaProductNameCard } from "@/components/start/idea-product-name-card";
import { useSession } from "@/contexts/session-context";
import { usePortfolio } from "@/contexts/portfolio-context";
import type { UserProject } from "@/lib/portfolio";
import { PENDING_PROJECT_STORAGE_KEY } from "@/lib/portfolio";
import type { IdeaClarifyTurn, IdeaDraft } from "@/types/idea-brief";
import { IDEA_DRAFT_STORAGE_KEY } from "@/types/idea-brief";

type SessionResponse =
  | ({ status: "clarify" } & IdeaClarifyPrompt & { draft: IdeaDraft })
  | { status: "ready"; summary: string; draft: IdeaDraft };

function loadDraft(): IdeaDraft | null {
  try {
    const raw = sessionStorage.getItem(IDEA_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IdeaDraft;
  } catch {
    return null;
  }
}

function saveDraft(draft: IdeaDraft) {
  sessionStorage.setItem(IDEA_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function StartClientInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useSession();
  const { registerProject } = usePortfolio();

  const [initialIdea, setInitialIdea] = useState("");
  const [turns, setTurns] = useState<IdeaClarifyTurn[]>([]);
  const [pending, setPending] = useState<IdeaClarifyPrompt | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSession = useCallback(
    async (opts: {
      idea: string;
      turns: IdeaClarifyTurn[];
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/idea/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initialIdea: opts.idea,
            turns: opts.turns,
          }),
        });
        const data = (await res.json()) as SessionResponse & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Analyse impossible");

        saveDraft(data.draft);

        if (data.status === "ready") {
          setSummary(data.summary);
          setPending(null);
        } else {
          setSummary(null);
          setPending({
            insight: data.insight,
            dimension: data.dimension,
            question: data.question,
            questionType: data.questionType,
            suggestions: data.suggestions ?? [],
            allowCustom: data.allowCustom ?? true,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const fromQuery = searchParams.get("idea")?.trim();
    const saved = loadDraft();
    const idea = fromQuery || saved?.initialIdea || "";
    if (!idea) return;

    setInitialIdea(idea);
    if (saved?.summary) {
      setSummary(saved.summary);
      setTurns(saved.turns);
      if (saved.productName) setProductName(saved.productName);
      return;
    }
    if (saved && saved.initialIdea === idea && saved.turns.length > 0) {
      setTurns(saved.turns);
      void runSession({ idea, turns: saved.turns });
      return;
    }
    void runSession({ idea, turns: [] });
  }, [searchParams, runSession]);

  useEffect(() => {
    if (!summary || !initialIdea) return;
    saveDraft({
      initialIdea,
      turns,
      summary,
      ...(productName.trim() ? { productName: productName.trim() } : {}),
    });
  }, [initialIdea, turns, summary, productName]);

  useEffect(() => {
    if (searchParams.get("github") === "1" && isAuthenticated) {
      void (async () => {
        setCreating(true);
        try {
          const res = await fetch("/api/onboarding/github", { method: "POST" });
          const ghData = (await res.json()) as { projectId?: string; project?: UserProject };
          if (ghData.project) {
            sessionStorage.setItem(PENDING_PROJECT_STORAGE_KEY, JSON.stringify(ghData.project));
          }
          if (ghData.projectId) {
            window.location.href = `/api/connectors/github/oauth?projectId=${encodeURIComponent(ghData.projectId)}&module=build`;
          }
        } finally {
          setCreating(false);
        }
      })();
    }
  }, [searchParams, isAuthenticated]);

  const submitAnswer = useCallback(
    (answer: string, meta?: Pick<IdeaClarifyTurn, "questionType" | "dimension">) => {
      if (!pending || !answer.trim()) return;
      const nextTurns = [
        ...turns,
        {
          question: pending.question,
          answer: answer.trim(),
          questionType: meta?.questionType ?? pending.questionType,
          dimension: meta?.dimension ?? pending.dimension,
        },
      ];
      setTurns(nextTurns);
      setPending(null);
      void runSession({
        idea: initialIdea,
        turns: nextTurns,
      });
    },
    [pending, turns, initialIdea, runSession],
  );

  const handleCreate = useCallback(async () => {
    if (!summary || !productName.trim()) return;
    if (!isAuthenticated) {
      saveDraft({ initialIdea, turns, summary, productName: productName.trim() });
      router.push(`/login?next=${encodeURIComponent("/start")}`);
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/idea/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialIdea,
          turns,
          summary,
          productName: productName.trim(),
        }),
      });
      const data = (await res.json()) as {
        projectId?: string;
        project?: UserProject;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Création impossible");

      if (data.project) {
        registerProject(data.project);
      }

      sessionStorage.removeItem(IDEA_DRAFT_STORAGE_KEY);
      router.push(`/cockpit/${data.projectId}?module=build&welcome=idea`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }, [summary, productName, isAuthenticated, initialIdea, turns, router, registerProject]);

  if (!initialIdea && !creating) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-muted-foreground">Décrivez d&apos;abord votre idée depuis la page d&apos;accueil.</p>
        <Button asChild className="mt-4">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-xl flex-col px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour
      </Link>

      <header className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Votre idée
        </p>
        <blockquote className="border-l-2 border-primary/40 pl-4 font-display text-lg leading-snug tracking-tight">
          {initialIdea}
        </blockquote>
      </header>

      <div className="flex-1 space-y-6">
        <IdeaClarifyChat
          turns={turns}
          pending={pending}
          loading={loading}
          onSubmitAnswer={submitAnswer}
        />

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {summary && !loading ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card/60 p-5">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium">Idée claire — prête à structurer</p>
                  <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
                </div>
              </div>
            </div>

            <IdeaProductNameCard
              initialIdea={initialIdea}
              summary={summary}
              value={productName}
              onChange={setProductName}
            />

            <Button
              type="button"
              className="w-full"
              disabled={creating || !productName.trim()}
              onClick={handleCreate}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération de votre fiche…
                </>
              ) : (
                "Créer mon projet →"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Business model, concurrence et plan dans l&apos;onglet Idée du cockpit.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function StartFallback() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
    </main>
  );
}

export function StartClient() {
  return (
    <Suspense fallback={<StartFallback />}>
      <StartClientInner />
    </Suspense>
  );
}
