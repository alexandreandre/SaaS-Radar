import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/auth";
import {
  adminAccessRedirectPath,
  adminGateRedirectPath,
} from "@/lib/admin/gate-redirect";
import { evaluateAdminSessionGate } from "@/lib/admin/session-gate";
import {
  ADMIN_GATE_COOKIE,
  hasAdminGateFromRequest,
  isAdminAccessTokenConfigured,
  verifyAdminGateCookieValue,
} from "@/lib/admin/access-token";
import type { AdminRole } from "@/lib/admin/rbac";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function assertAdminAccessTokenGate(next: string): Promise<void> {
  if (!isAdminAccessTokenConfigured()) return;

  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(ADMIN_GATE_COOKIE)?.value;
  if (verifyAdminGateCookieValue(gateCookie)) return;

  redirect(adminAccessRedirectPath(next));
}

export async function requireAdminPage(
  next = "/admin"
): Promise<{ role: AdminRole }> {
  await assertAdminAccessTokenGate(next);

  const supabase = await createServerSupabaseClient();
  const user = await getCurrentUser();
  const profile = user ? await getProfile() : null;
  const gate = await evaluateAdminSessionGate(supabase, user, profile);
  const redirectPath = adminGateRedirectPath(gate, next);
  if (redirectPath) redirect(redirectPath);
  if (gate.status !== "ok") redirect("/admin/login");
  return { role: gate.role };
}

export async function requireAdminGateOnly(next = "/admin"): Promise<void> {
  if (!isAdminAccessTokenConfigured()) return;

  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(ADMIN_GATE_COOKIE)?.value;
  if (verifyAdminGateCookieValue(gateCookie)) return;

  redirect(adminAccessRedirectPath(next));
}

/** Pour les route handlers API admin (hors secret machine). */
export function requireAdminGateApi(request: Request): boolean {
  return hasAdminGateFromRequest(request);
}

/** True si le cookie admin_gate est valide (ou si le token d'accès n'est pas configuré). */
export async function hasAdminGate(): Promise<boolean> {
  if (!isAdminAccessTokenConfigured()) return true;
  const cookieStore = await cookies();
  return verifyAdminGateCookieValue(cookieStore.get(ADMIN_GATE_COOKIE)?.value);
}
