import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  CreditCard,
  Globe2,
  HelpCircle,
  Mail,
  Newspaper,
  Rocket,
  Sparkles,
} from "lucide-react";
import type { NavIconId } from "@/lib/nav-links";

export const NAV_LINK_ICONS: Record<NavIconId, LucideIcon> = {
  globe: Globe2,
  sparkles: Sparkles,
  mail: Mail,
  help: HelpCircle,
  "credit-card": CreditCard,
  newspaper: Newspaper,
  calculator: Calculator,
  rocket: Rocket,
};

export function getNavLinkIcon(id: NavIconId): LucideIcon {
  return NAV_LINK_ICONS[id];
}
