export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <p className="mb-2 text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-lg" aria-hidden>
        {icon}
      </p>
    </div>
  );
}
