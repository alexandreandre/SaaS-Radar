import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { OPPORTUNITIES_CACHE_TAG } from "@/lib/opportunities-cache-tag";

export async function promoteWeeklyPick(slug: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("opportunities").update({ weekly_pick: false }).eq("weekly_pick", true);
  await admin.from("opportunities").update({ weekly_pick: true }).eq("slug", slug);
}

export function revalidateOpportunitiesCache(): void {
  revalidatePath("/");
  revalidateTag(OPPORTUNITIES_CACHE_TAG);
  revalidatePath("/opportunities", "page");
  revalidatePath("/opportunities/[slug]", "page");
}
