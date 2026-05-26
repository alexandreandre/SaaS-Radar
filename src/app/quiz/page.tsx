"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { opportunities } from "@/data/opportunities";
import type { Opportunity } from "@/types/opportunity";

const questions = [
  {
    id: "time",
    emoji: "⏱️",
    question: "Tu as combien de temps à consacrer à ce projet ?",
    subtitle: "Sois honnête — ça change tout",
    options: [
      { value: "low", label: "Quelques heures par semaine", sublabel: "Side project en parallèle" },
      { value: "medium", label: "Mi-temps", sublabel: "2-3 jours par semaine" },
      { value: "high", label: "Full focus", sublabel: "Je me lance à 100%" },
    ],
  },
  {
    id: "tech",
    emoji: "💻",
    question: "Ton niveau technique ?",
    subtitle: "Pas de jugement — on adapte la recommandation",
    options: [
      { value: "none", label: "Zéro code", sublabel: "No-code uniquement (Webflow, Notion...)" },
      { value: "low", label: "Un peu", sublabel: "Je peux utiliser Claude Code / Cursor" },
      { value: "high", label: "Je code", sublabel: "Dev confirmé" },
    ],
  },
  {
    id: "client",
    emoji: "🎯",
    question: "Tu préfères quel type de client ?",
    subtitle: "Ton futur client idéal",
    options: [
      { value: "artisan", label: "Artisans & PME locales", sublabel: "Plombiers, boulangers, artisans..." },
      { value: "pro", label: "Professions libérales", sublabel: "Médecins, avocats, comptables..." },
      { value: "b2b", label: "Entreprises B2B", sublabel: "PME, startups, équipes..." },
    ],
  },
  {
    id: "budget",
    emoji: "💰",
    question: "Ton budget de départ ?",
    subtitle: "Pour les outils, pas le salaire",
    options: [
      { value: "zero", label: "Bootstrap total", sublabel: "0€ — je démarre sans rien" },
      { value: "low", label: "Petit budget", sublabel: "Moins de 500€" },
      { value: "medium", label: "Budget confortable", sublabel: "500€ et plus" },
    ],
  },
] as const;

const QUIZ_SLUGS = [
  "ai-receptionist-dental",
  "quote-generator-contractors",
  "hr-compliance-tracker",
  "accounting-client-portal",
  "sms-reminder-physio",
  "lawyer-time-billing",
] as const;

function getRecommendation(answers: Record<string, string>): string {
  const scores: Record<string, number> = Object.fromEntries(
    QUIZ_SLUGS.map((slug) => [slug, 0])
  );

  if (answers.time === "low") {
    scores["sms-reminder-physio"] += 3;
    scores["quote-generator-contractors"] += 2;
  }
  if (answers.time === "high") {
    scores["ai-receptionist-dental"] += 3;
    scores["hr-compliance-tracker"] += 2;
  }

  if (answers.tech === "none") {
    scores["quote-generator-contractors"] += 3;
    scores["sms-reminder-physio"] += 2;
  }
  if (answers.tech === "high") {
    scores["ai-receptionist-dental"] += 3;
    scores["hr-compliance-tracker"] += 2;
  }

  if (answers.client === "artisan") {
    scores["quote-generator-contractors"] += 4;
  }
  if (answers.client === "pro") {
    scores["ai-receptionist-dental"] += 3;
    scores["sms-reminder-physio"] += 3;
    scores["lawyer-time-billing"] += 3;
  }
  if (answers.client === "b2b") {
    scores["hr-compliance-tracker"] += 4;
    scores["accounting-client-portal"] += 3;
  }

  if (answers.budget === "zero") {
    scores["sms-reminder-physio"] += 2;
    scores["quote-generator-contractors"] += 2;
  }
  if (answers.budget === "medium") {
    scores["ai-receptionist-dental"] += 2;
    scores["hr-compliance-tracker"] += 2;
  }

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function getMatchReasons(answers: Record<string, string>, opp: Opportunity): string[] {
  const reasons: string[] = [];
  if (answers.time === "low" && opp.buildableUnder30Days) {
    reasons.push("Lançable rapidement, même avec peu de temps");
  }
  if (answers.tech === "none" && opp.techComplexity === "low") {
    reasons.push("Faible complexité technique — no-code possible");
  }
  if (answers.client === "artisan" && opp.sector === "construction") {
    reasons.push("Parfaitement aligné avec ton client cible");
  }
  if (answers.client === "pro" && ["healthcare", "legal"].includes(opp.sector)) {
    reasons.push("Professions libérales — ton marché cible exact");
  }
  if (answers.budget === "zero" && opp.scores.buildability >= 8) {
    reasons.push("Buildable avec peu ou pas de budget initial");
  }
  if (opp.franceCompetition === "none" || opp.franceCompetition === "low") {
    reasons.push("Quasi aucune concurrence en France aujourd'hui");
  }
  return reasons.slice(0, 3);
}

const questionVariants = {
  initial: { opacity: 0, x: 24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: { opacity: 0, x: -24, transition: { duration: 0.25 } },
};

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const isResult = step === 4;
  const currentQuestion = questions[step];

  const recommendedSlug = useMemo(
    () => (isResult ? getRecommendation(answers) : null),
    [answers, isResult]
  );

  const recommended = useMemo(
    () => opportunities.find((o) => o.slug === recommendedSlug),
    [recommendedSlug]
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleAnswer = useCallback(
    (value: string) => {
      if (!currentQuestion) return;
      const nextAnswers = { ...answers, [currentQuestion.id]: value };
      setAnswers(nextAnswers);
      setStep((s) => (s < 3 ? s + 1 : 4));
    },
    [answers, currentQuestion]
  );

  const restart = () => {
    setStep(0);
    setAnswers({});
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar dark />
      <main className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-16">
        {!isResult && currentQuestion && (
          <>
            <div className="w-full max-w-lg mb-8">
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>
                  Question {step + 1} / 4
                </span>
                <span>{Math.round(((step + 1) / 4) * 100)}%</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full">
                <div
                  className="h-1 bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${((step + 1) / 4) * 100}%` }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={questionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full max-w-lg"
              >
                <p className="text-5xl mb-6 text-center">{currentQuestion.emoji}</p>
                <h1 className="text-2xl font-bold text-white text-center mb-2">
                  {currentQuestion.question}
                </h1>
                <p className="text-gray-500 text-center mb-8">{currentQuestion.subtitle}</p>

                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAnswer(option.value)}
                      className="w-full text-left p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-blue-500/50 hover:bg-blue-950/20 transition-all group"
                    >
                      <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                        {option.label}
                      </p>
                      <p className="text-gray-500 text-sm mt-0.5">{option.sublabel}</p>
                    </button>
                  ))}
                </div>

                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="mt-6 text-sm text-gray-600 hover:text-gray-400 transition-colors mx-auto block"
                  >
                    ← Question précédente
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {isResult && recommended && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg text-center"
          >
            <p className="text-4xl mb-4">🎯</p>
            <p className="text-sm text-blue-400 uppercase tracking-widest mb-2">Ton match SaaS</p>
            <h2 className="text-3xl font-bold text-white mb-2">{recommended.name}</h2>
            <p className="text-gray-400 mb-8">{recommended.pitch}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                <p className="text-2xl font-bold text-green-400">
                  {recommended.scores.franceFit}/10
                </p>
                <p className="text-xs text-gray-500 mt-1">France Fit</p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                <p className="text-2xl font-bold text-blue-400">
                  {recommended.scores.buildability}/10
                </p>
                <p className="text-xs text-gray-500 mt-1">Facilité</p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                <p className="text-2xl font-bold text-purple-400">
                  {recommended.revenueMin.toLocaleString("fr-FR")}€
                </p>
                <p className="text-xs text-gray-500 mt-1">MRR min</p>
              </div>
            </div>

            <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl text-left mb-6">
              <p className="text-sm font-semibold text-white mb-3">Pourquoi c&apos;est ton match :</p>
              <div className="space-y-2">
                {getMatchReasons(answers, recommended).map((reason, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <p className="text-gray-300 text-sm">{reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={`/opportunities/${recommended.slug}`}
              className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
            >
              Voir l&apos;opportunité complète →
            </Link>
            <button
              type="button"
              onClick={restart}
              className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
            >
              ↺ Refaire le test
            </button>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
