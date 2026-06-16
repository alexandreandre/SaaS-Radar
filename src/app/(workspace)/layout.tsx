import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";

/** Routes du groupe (workspace) exigeant une session. */
const PROTECTED_PREFIXES = ["/dashboard", "/mes-saas", "/cockpit", "/account"];
/** Routes exigeant en plus profiles.is_admin. */
const ADMIN_PREFIXES = ["/admin"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  const needsAdmin = matches(pathname, ADMIN_PREFIXES);
  const needsAuth = needsAdmin || matches(pathname, PROTECTED_PREFIXES);

  if (needsAuth) {
    const user = await getCurrentUser();
    if (!user) {
      const next = pathname || "/dashboard";
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }
    if (needsAdmin && !(await isAdmin())) {
      // Masque l'existence de l'admin aux non-admins.
      notFound();
    }
  }

  return <>{children}</>;
}
