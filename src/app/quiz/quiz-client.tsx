"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import type { Opportunity } from "@/types/opportunity";

const questions = [
  {
    id: "situation",
    emoji: "👤",
    question: "Tu es dans quelle situation en ce moment ?",
    subtitle: "Sois honnête — ça change la recommandation",
    options: [
      { value: "cdi", label: "J'ai un CDI", sublabel: "Je veux un revenu complémentaire" },
      { value: "student", label: "Étudiant / En reconversion", sublabel: "Je cherche ma voie" },
      { value: "freelance", label: "Freelance / Indépendant", sublabel: "Je veux diversifier mes revenus" },
      { value: "fulltime", label: "Je veux quitter mon job", sublabel: "Je mise tout sur ce projet" },
    ],
  },
  {
    id: "experience",
    emoji: "🚀",
    question: "T'as déjà lancé quelque chose ?",
    subtitle: "Pas de jugement — on adapte le niveau de la reco",
    options: [
      { value: "never", label: "Jamais", sublabel: "C'est mon premier projet" },
      { value: "tried", label: "J'ai essayé", sublabel: "Ça n'a pas marché, je recommence" },
      { value: "already", label: "J'ai déjà des revenus en ligne", sublabel: "Je veux scaler" },
    ],
  },
  {
    id: "tech",
    emoji: "💻",
    question: "Ton niveau avec les outils tech ?",
    subtitle: "Sois réaliste — ça détermine ce que tu peux lancer",
    options: [
      { value: "none", label: "Zéro code", sublabel: "Je veux du no-code uniquement" },
      {
        value: "medium",
        label: "J'utilise Claude / Cursor / Bubble",
        sublabel: "Je me débrouille avec les outils IA",
      },
      { value: "dev", label: "Je suis développeur", sublabel: "Je peux coder moi-même" },
    ],
  },
  {
    id: "sector",
    emoji: "🎯",
    question: "T'as une affinité avec quel monde ?",
    subtitle: "Vendre à des gens que tu connais = conversion x3",
    options: [
      { value: "health", label: "Santé / Médical / Bien-être", sublabel: "Médecins, kiné, dentistes..." },
      {
        value: "construction",
        label: "BTP / Artisans / Commerce local",
        sublabel: "Plombiers, électriciens, boulangers...",
      },
      {
        value: "finance",
        label: "Finance / Juridique / Comptabilité",
        sublabel: "Avocats, comptables, conseillers...",
      },
      { value: "any", label: "Tout me convient", sublabel: "Si ça rapporte, je suis partant" },
    ],
  },
  {
    id: "time",
    emoji: "⏱️",
    question: "Tu peux y consacrer combien de temps ?",
    subtitle: "Réaliste — mieux vaut sous-estimer",
    options: [
      { value: "low", label: "Quelques heures le week-end", sublabel: "Side project en parallèle" },
      { value: "medium", label: "2-3 jours par semaine", sublabel: "Mi-temps sur le projet" },
      { value: "high", label: "Full time", sublabel: "Je suis 100% dispo" },
    ],
  },
  {
    id: "goal",
    emoji: "💰",
    question: "C'est quoi ton objectif numéro 1 ?",
    subtitle: "Sois honnête avec toi-même",
    options: [
      { value: "quick", label: "Gagner 1 000€/mois rapidement", sublabel: "Je veux voir des résultats vite" },
      { value: "scale", label: "Construire un vrai business", sublabel: "Je pense long terme" },
      { value: "test", label: "Tester avant de tout miser", sublabel: "Je veux valider l'idée d'abord" },
    ],
  },
];

function getRecommendation(answers: Record<string, string>): string {
  const scores: Record<string, number> = {
    "ai-receptionist-dental": 0,
    "quote-generator-contractors": 0,
    "hr-compliance-tracker": 0,
    "accounting-client-portal": 0,
    "sms-reminder-physio": 0,
    "lawyer-time-billing": 0,
  };

  if (answers.situation === "cdi" || answers.situation === "student") {
    scores["sms-reminder-physio"] += 3;
    scores["quote-generator-contractors"] += 2;
  }
  if (answers.situation === "fulltime") {
    scores["ai-receptionist-dental"] += 3;
    scores["hr-compliance-tracker"] += 2;
  }

  if (answers.experience === "never") {
    scores["sms-reminder-physio"] += 3;
    scores["quote-generator-contractors"] += 2;
  }
  if (answers.experience === "already") {
    scores["ai-receptionist-dental"] += 2;
    scores["hr-compliance-tracker"] += 3;
  }

  if (answers.tech === "none") {
    scores["quote-generator-contractors"] += 4;
    scores["sms-reminder-physio"] += 2;
  }
  if (answers.tech === "dev") {
    scores["ai-receptionist-dental"] += 4;
    scores["hr-compliance-tracker"] += 3;
  }

  if (answers.sector === "health") {
    scores["ai-receptionist-dental"] += 5;
    scores["sms-reminder-physio"] += 4;
  }
  if (answers.sector === "construction") {
    scores["quote-generator-contractors"] += 6;
  }
  if (answers.sector === "finance") {
    scores["accounting-client-portal"] += 5;
    scores["lawyer-time-billing"] += 4;
  }
  if (answers.sector === "any") {
    scores["sms-reminder-physio"] += 2;
    scores["quote-generator-contractors"] += 2;
  }

  if (answers.time === "low") {
    scores["sms-reminder-physio"] += 3;
    scores["quote-generator-contractors"] += 2;
  }
  if (answers.time === "high") {
    scores["ai-receptionist-dental"] += 3;
    scores["hr-compliance-tracker"] += 2;
  }

  if (answers.goal === "quick") {
    scores["sms-reminder-physio"] += 3;
    scores["quote-generator-contractors"] += 3;
  }
  if (answers.goal === "scale") {
    scores["ai-receptionist-dental"] += 3;
    scores["hr-compliance-tracker"] += 2;
  }

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function getMatchReasons(answers: Record<string, string>, slug: string): string[] {
  const reasons: string[] = [];

  if (
    answers.tech === "none" &&
    (slug === "quote-generator-contractors" || slug === "sms-reminder-physio")
  ) {
    reasons.push("Lançable sans coder — no-code ou Claude Code suffisent");
  }
  if (answers.tech === "dev" && slug === "ai-receptionist-dental") {
    reasons.push("Ta stack technique te donne un avantage compétitif immédiat");
  }
  if (
    answers.sector === "health" &&
    (slug === "ai-receptionist-dental" || slug === "sms-reminder-physio")
  ) {
    reasons.push("Tu connais ce marché — la vente sera 3x plus facile");
  }
  if (answers.sector === "construction" && slug === "quote-generator-contractors") {
    reasons.push("380 000 artisans utilisent encore Word pour leurs devis");
  }
  if (answers.time === "low" && slug === "sms-reminder-physio") {
    reasons.push("Buildable en quelques week-ends — complexité technique faible");
  }
  if (answers.goal === "quick") {
    reasons.push("CAC faible et ROI rapide — premiers clients en < 30 jours");
  }
  if (answers.situation === "cdi") {
    reasons.push("Parfait pour un side project — pas besoin de quitter ton job");
  }
  if (answers.experience === "never") {
    reasons.push("Idéal pour un premier projet — pas besoin d'expérience préalable");
  }

  return reasons.slice(0, 3);
}

export function QuizClient({ opportunities }: { opportunities: Opportunity[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendedSlug, setRecommendedSlug] = useState<string | null>(null);

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [questions[step].id]: value };
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
    } else {
      setRecommendedSlug(getRecommendation(newAnswers));
    }
  };

  const recommended = opportunities.find((o) => o.slug === recommendedSlug);
  const matchReasons = recommended ? getMatchReasons(answers, recommended.slug) : [];
  const currentQuestion = questions[step];
  const isResult = recommendedSlug !== null;

  const restart = () => {
    setStep(0);
    setAnswers({});
    setRecommendedSlug(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-16">
        <AnimatePresence mode="wait">
          {!isResult ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg"
            >
              <div className="mb-8">
                <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                  <span>
                    Question {step + 1} / {questions.length}
                  </span>
                  <span>{Math.round(((step + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="h-1 rounded-full bg-muted">
                  <div
                    className="h-1 rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <p className="mb-6 text-center text-5xl">{currentQuestion.emoji}</p>
              <h2 className="mb-2 text-center font-display text-2xl font-medium text-foreground">
                {currentQuestion.question}
              </h2>
              <p className="mb-8 text-center text-sm text-muted-foreground">
                {currentQuestion.subtitle}
              </p>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleAnswer(option.value)}
                    className="group w-full rounded-xl border border-border bg-muted/20 p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
                  >
                    <p className="font-medium text-foreground transition-colors group-hover:text-primary">
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{option.sublabel}</p>
                  </button>
                ))}
              </div>

              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="mx-auto mt-6 block text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Question précédente
                </button>
              )}
            </motion.div>
          ) : (
            recommended && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
              >
                <p className="mb-4 text-center text-4xl">🎯</p>
                <p className="mb-2 text-center font-data text-xs uppercase tracking-widest text-primary">
                  Ton match SaaS
                </p>
                <h2 className="mb-2 text-center font-display text-3xl font-medium text-foreground">
                  {recommended.name}
                </h2>
                <p className="mb-8 text-center text-muted-foreground">{recommended.pitch}</p>

                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {recommended.scores.franceFit}/10
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">France Fit</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {recommended.scores.buildability}/10
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Facilité</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {recommended.revenueMin.toLocaleString("fr-FR")}€
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">MRR min</p>
                  </div>
                </div>

                {matchReasons.length > 0 && (
                  <div className="mb-6 rounded-xl border border-border bg-muted/20 p-5">
                    <p className="mb-3 text-sm font-semibold text-foreground">
                      Pourquoi c&apos;est ton match :
                    </p>
                    <div className="space-y-2">
                      {matchReasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 shrink-0 text-primary">✓</span>
                          <p className="text-sm text-muted-foreground">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href={`/opportunities/${recommended.slug}`}
                  className="mb-3 block w-full rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Voir l&apos;opportunité complète →
                </Link>
                <button
                  type="button"
                  onClick={restart}
                  className="mx-auto block text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  ↺ Refaire le test
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
