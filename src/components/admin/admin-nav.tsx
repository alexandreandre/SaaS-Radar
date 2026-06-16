"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  CreditCard,
  Globe2,
  LayoutDashboard,
  Mail,
  Radar,
  ScrollText,
  Settings,
  Shield,
  Users,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/lib/admin/rbac";
import { ADMIN_ROLE_LABELS } from "@/lib/admin/rbac";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/sourcing", label: "Sourcing", icon: Radar },
  { href: "/admin/opportunities", label: "Catalogue", icon: BookOpen },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/billing", label: "Abonnements", icon: CreditCard },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/markets", label: "Carte & pays", icon: Globe2 },
  { href: "/admin/cockpit", label: "Cockpit", icon: Workflow },
  { href: "/admin/system", label: "Système", icon: Settings },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
  { href: "/admin/security", label: "Sécurité", icon: Shield },
];

export function AdminNav({ role, email }: { role: AdminRole; email: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-5">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">SaaS Radar Admin</p>
            <p className="text-xs text-muted-foreground">{ADMIN_ROLE_LABELS[role]}</p>
          </div>
        </div>
        {email && (
          <p className="mt-2 truncate text-xs text-muted-foreground">{email}</p>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Retour au produit
        </Link>
      </div>
    </aside>
  );
}
