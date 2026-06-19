import { NextResponse } from "next/server";
import { getOpportunityListItems } from "@/lib/opportunities";

export const runtime = "nodejs";
export const revalidate = 3600;

/** Index léger du catalogue (cartes, mes-saas favoris). */
export async function GET() {
  try {
    const items = await getOpportunityListItems();
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
