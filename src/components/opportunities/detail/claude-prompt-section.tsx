"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

const DEFAULT_STACK = ["Next.js 14", "Supabase", "Stripe", "Tailwind CSS"];

const USAGE_STEPS = [
  {
    tool: "Claude Code",
    icon: "🤖",
    instruction: "Ouvre Claude Code → New conversation → Colle le prompt → Lance",
    time: "~4h",
  },
  {
    tool: "Cursor",
    icon: "⚡",
    instruction: 'Ouvre Cursor → Cmd+L → Colle le prompt → Demande "génère tout"',
    time: "~3h",
  },
  {
    tool: "v0 by Vercel",
    icon: "🎨",
    instruction: "Va sur v0.dev → Colle le prompt → Génère l'UI → Exporte",
    time: "~2h (UI only)",
  },
] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-400" />
          <span className="text-green-400">Copié !</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copier le prompt</span>
        </>
      )}
    </button>
  );
}

function getRecommendedStack(opportunity: Opportunity): string[] {
  if (opportunity.mvpPlan.stack.length > 0) {
    return opportunity.mvpPlan.stack;
  }

  const stackLine = opportunity.claudePrompt
    .split("\n")
    .find((line) => /^Stack:/i.test(line.trim()));

  if (stackLine) {
    const parsed = stackLine
      .replace(/^Stack:\s*/i, "")
      .split(/,|·|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (parsed.length > 0) return parsed;
  }

  return DEFAULT_STACK;
}

interface ClaudePromptSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

export function ClaudePromptSection({ opportunity, animationIndex }: ClaudePromptSectionProps) {
  const stack = getRecommendedStack(opportunity);

  return (
    <AnimatedSection id="prompt" animationIndex={animationIndex} className="mb-12 scroll-mt-24">
      <SectionTitle number={8} title="Prompt Claude Code" />
      <p className="text-sm text-gray-500 mb-6">
        Colle ce prompt dans Claude Code, Cursor ou v0 — ton MVP démarre en une session
      </p>

      <div className="flex items-center gap-2 mb-6 p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl">
        <span className="text-purple-400 text-lg">⚡</span>
        <div>
          <p className="text-sm font-semibold text-white">Prompt validé par notre équipe</p>
          <p className="text-xs text-gray-500">
            Testé sur Claude Code · Cursor · v0 — génère un MVP fonctionnel en ~4h
          </p>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-gray-500 ml-2">prompt.txt</span>
          </div>
          <CopyButton text={opportunity.claudePrompt} />
        </div>

        <div className="bg-gray-950 border border-t-0 border-gray-700 rounded-b-xl p-6 overflow-x-auto">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
            {opportunity.claudePrompt}
          </pre>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {USAGE_STEPS.map((item, i) => (
          <div key={i} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span>{item.icon}</span>
              <p className="text-sm font-semibold text-white">{item.tool}</p>
              <span className="ml-auto text-xs text-gray-600">{item.time}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{item.instruction}</p>
          </div>
        ))}
      </div>

      <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Stack recommandée</p>
        <div className="flex flex-wrap gap-2">
          {stack.map((tech) => (
            <span
              key={tech}
              className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-full"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
