import type { LucideIcon } from "lucide-react";
import { HelpCircle, Mail, Sparkles } from "lucide-react";
import type { NavIconId } from "@/lib/nav-links";

export const NAV_LINK_ICONS: Record<NavIconId, LucideIcon> = {
  sparkles: Sparkles,
  mail: Mail,
  help: HelpCircle,
};

export function getNavLinkIcon(id: NavIconId): LucideIcon {
  return NAV_LINK_ICONS[id];
}
