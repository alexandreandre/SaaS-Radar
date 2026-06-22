import type { SupabaseClient, User } from "@supabase/supabase-js";
import { hasAdminAccess, normalizeAdminRole, type AdminRole } from "@/lib/admin/rbac";

export type AdminSessionGate =
  | { status: "ok"; role: AdminRole }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

type ProfileAdminFields = {
  admin_role?: string | null;
  is_admin?: boolean | null;
};

export function isAdminConsolePath(pathname: string): boolean {
  if (pathname === "/admin/access") return false;
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === "/admin/login" || pathname.startsWith("/admin/login/");
}

export async function evaluateAdminSessionGate(
  _supabase: SupabaseClient,
  user: User | null,
  profile: ProfileAdminFields | null | undefined
): Promise<AdminSessionGate> {
  if (!user) return { status: "unauthenticated" };

  const role = normalizeAdminRole(profile?.admin_role, profile?.is_admin);
  if (!hasAdminAccess(role)) return { status: "forbidden" };

  return { status: "ok", role };
}
