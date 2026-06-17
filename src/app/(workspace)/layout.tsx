import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/** Routes du groupe (workspace) exigeant une session. */
const PROTECTED_PREFIXES = ["/mes-saas", "/cockpit", "/account"];

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

  const needsAuth = matches(pathname, PROTECTED_PREFIXES);

  if (needsAuth) {
    const user = await getCurrentUser();
    if (!user) {
      const next = pathname || "/mes-saas";
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }
  }

  return <>{children}</>;
}
