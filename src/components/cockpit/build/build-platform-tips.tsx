"use client";

import type { ReactNode } from "react";
import { ChevronDown, Keyboard, ListTree, Terminal, type LucideIcon } from "lucide-react";
import type { BuildTool } from "@/lib/build/tools";
import { getPlatformTips } from "@/lib/build/platform-tips";
import { BuildCopyPrompt } from "@/components/cockpit/build/build-copy-prompt";

type BuildPlatformTipsProps = {
  tool: BuildTool;
};

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <kbd className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
        {keys}
      </kbd>
    </div>
  );
}

function TipCollapsible({
  icon: Icon,
  title,
  hint,
  badge,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-border/70 bg-muted/10">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{title}</span>
        {badge ? (
          <span className="shrink-0 rounded-full bg-violet-500/12 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
            {badge}
          </span>
        ) : null}
        {hint ? <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{hint}</span> : null}
      </summary>
      <div className="space-y-2.5 border-t border-border/60 px-3 py-3">{children}</div>
    </details>
  );
}

export function BuildPlatformTips({ tool }: BuildPlatformTipsProps) {
  const tips = getPlatformTips(tool.id);
  if (!tips) return null;

  const optionalSections = [
    tips.planMode,
    tips.localRun,
    tips.shortcuts?.length ? tips.shortcuts : null,
  ].filter(Boolean).length;

  return (
    <section className="rounded-xl border border-border/70 bg-background p-4">
      <header className="mb-4">
        <h4 className="text-sm font-semibold text-foreground">Astuces {tool.name}</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Après le premier prompt — pour itérer, tester en local et gagner du temps
        </p>
      </header>

      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/75">À retenir — </span>
        {tips.iterationHint}
      </p>

      {optionalSections > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="px-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Aller plus loin — cliquer pour ouvrir
          </p>

          {tips.planMode ? (
            <TipCollapsible
              icon={ListTree}
              title="Mode plan"
              badge="Changements majeurs"
              hint="3 étapes"
            >
              <p className="text-xs leading-relaxed text-muted-foreground">{tips.planMode.lead}</p>
              <ol className="space-y-1.5 text-xs text-foreground/90">
                {tips.planMode.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 font-semibold text-primary">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </TipCollapsible>
          ) : null}

          {tips.localRun ? (
            <TipCollapsible icon={Terminal} title="Tester en local" hint="Prompt à copier">
              <p className="text-xs leading-relaxed text-muted-foreground">{tips.localRun.lead}</p>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {tips.localRun.prerequisites.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
              <BuildCopyPrompt
                label={`Demandez à ${tool.name}`}
                text={tips.localRun.askPrompt}
                compact
              />
              {tips.localRun.commands?.length ? (
                <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Commandes habituelles
                  </p>
                  <pre className="mt-1 overflow-x-auto font-mono text-[11px] leading-relaxed text-foreground/80">
                    {tips.localRun.commands.join("\n")}
                  </pre>
                </div>
              ) : null}
            </TipCollapsible>
          ) : null}

          {tips.shortcuts?.length ? (
            <TipCollapsible
              icon={Keyboard}
              title="Raccourcis Mac"
              hint={`${tips.shortcuts.length} raccourcis`}
            >
              <div className="space-y-1">
                {tips.shortcuts.map((s) => (
                  <ShortcutRow key={s.keys + s.label} keys={s.keys} label={s.label} />
                ))}
              </div>
            </TipCollapsible>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
