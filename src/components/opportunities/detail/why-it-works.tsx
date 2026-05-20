import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";

export function WhyItWorks({ opportunity }: { opportunity: Opportunity }) {
  return (
    <SectionShell
      id="why"
      step={1}
      title="L'idée en bref"
      subtitle="Pourquoi ce modèle fonctionne déjà ailleurs — et peut marcher chez vous"
      emphasize
      className="scroll-mt-24 lg:-mt-1"
    >
      <ul className="space-y-5 text-lg leading-relaxed">
        {opportunity.whyItWorks.map((p, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-data text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
