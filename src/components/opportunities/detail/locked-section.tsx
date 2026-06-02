import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface LockedSectionProps {
  id: string;
  number: number;
  title: string;
  description: string;
  preview: string;
  animationIndex: number;
}

export function LockedSection({
  id,
  number,
  title,
  description,
  preview,
  animationIndex,
}: LockedSectionProps) {
  return (
    <AnimatedSection id={id} animationIndex={animationIndex} className="mb-12 scroll-mt-24">
      <SectionTitle number={number} title={title} />

      <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <p className="mb-3 text-sm text-gray-300">{description}</p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-400">{preview}</p>
      </div>
    </AnimatedSection>
  );
}
