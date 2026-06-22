import type { AdminSessionGate } from "@/lib/admin/session-gate";

export function adminGateRedirectPath(
  gate: AdminSessionGate,
  next = "/admin"
): string | null {
  switch (gate.status) {
    case "unauthenticated":
      return `/admin/login?next=${encodeURIComponent(next)}`;
    case "forbidden":
      return "/admin/login?error=forbidden";
    case "ok":
      return null;
  }
}

export function adminAccessRedirectPath(pathname: string): string {
  return `/admin/access?next=${encodeURIComponent(pathname)}`;
}
