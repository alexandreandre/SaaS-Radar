export function SectionTitle({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="rounded border border-gray-800 bg-gray-900 px-2 py-1 font-mono text-xs text-gray-600">
        {String(number).padStart(2, "0")}
      </span>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
  );
}
