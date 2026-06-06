import { formatCurrency, cn } from "@/lib/utils";

export function GapCallout({
  gap,
  target,
  currentMrr,
  scenario,
}: {
  gap: number | null;
  target: number;
  currentMrr: number;
  scenario: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 rounded-lg border px-4 py-3 text-sm",
        gap !== null && gap >= 0
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
          : "border-amber-500/30 bg-amber-500/10 text-amber-900"
      )}
    >
      {gap !== null && gap >= 0 ? (
        <p>
          Vous dépassez la promesse Radar ({scenario.toLowerCase()}) de <strong>+{gap} %</strong>.
        </p>
      ) : gap !== null ? (
        <p>
          Encore <strong>{formatCurrency(Math.max(0, target - currentMrr))}</strong> pour rattraper le
          scénario {scenario.toLowerCase()}.
        </p>
      ) : (
        <p>Définissez un objectif pour comparer votre progression.</p>
      )}
    </div>
  );
}
