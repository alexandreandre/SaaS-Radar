import { AdminOpportunitiesClient } from "@/components/admin/opportunities-client";
import { getAdminOpportunitiesPageData } from "@/lib/admin/opportunities";

type SearchParamsInput = Record<string, string | string[] | undefined>;

function asString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export async function AdminOpportunitiesLoader({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const status = asString(searchParams?.status) ?? "published";
  const q = asString(searchParams?.q);
  const sector = asString(searchParams?.sector);
  const country = asString(searchParams?.country);
  const minScoreRaw = asString(searchParams?.minScore);
  const sort = asString(searchParams?.sort) ?? "newest";
  const offset = Math.max(Number.parseInt(asString(searchParams?.offset) ?? "0", 10), 0);
  const minScore = minScoreRaw ? Number.parseInt(minScoreRaw, 10) : null;

  let initialData = null;
  let initialError: string | null = null;

  try {
    initialData = await getAdminOpportunitiesPageData({
      status,
      q,
      sector,
      country,
      minScore,
      sort,
      limit: 50,
      offset,
    });
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return (
    <AdminOpportunitiesClient
      initialStatus={status}
      initialData={initialData}
      initialError={initialError}
    />
  );
}
