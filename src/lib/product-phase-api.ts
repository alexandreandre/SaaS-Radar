import "server-only";

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { isCheckoutEnabled, isCockpitEnabled } from "@/lib/product-phase";

/** 403 si cockpit bloqué (discovery sans admin). */
export async function cockpitApiGuard(): Promise<NextResponse | null> {
  const admin = await isAdmin();
  if (isCockpitEnabled(admin)) return null;
  return NextResponse.json(
    { error: "Cockpit indisponible en phase discovery" },
    { status: 403 }
  );
}

/** 403 si checkout bloqué (discovery). */
export function checkoutApiGuard(): NextResponse | null {
  if (isCheckoutEnabled()) return null;
  return NextResponse.json(
    { error: "Abonnements indisponibles en phase discovery" },
    { status: 403 }
  );
}
