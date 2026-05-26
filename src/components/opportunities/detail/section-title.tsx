import { Lock } from "lucide-react";

export function SectionTitle({
  number,
  title,
  locked,
  plan,
}: {
  number: number;
  title: string;
  locked: boolean;
  plan?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="rounded border border-gray-800 bg-gray-900 px-2 py-1 font-mono text-xs text-gray-600">
        {String(number).padStart(2, "0")}
      </span>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {locked && plan && (
        <span className="ml-auto flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2 py-1 text-[10px] text-gray-400">
          <Lock className="h-2.5 w-2.5" />
          {plan}
        </span>
      )}
    </div>
  );
}
