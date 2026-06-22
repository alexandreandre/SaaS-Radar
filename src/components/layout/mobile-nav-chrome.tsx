"use client";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";

type MobileNavChromeProps = {
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  explore?: string | null;
  dark?: boolean;
};

/** Drawer + bottom nav — chargé en lazy depuis Navbar pour limiter le First Load JS. */
export function MobileNavChrome({
  menuOpen,
  onMenuOpenChange,
  explore = null,
  dark = false,
}: MobileNavChromeProps) {
  return (
    <>
      <MobileNavDrawer
        open={menuOpen}
        onOpenChange={onMenuOpenChange}
        explore={explore}
        dark={dark}
      />
      <MobileBottomNav
        onOpenMenu={() => onMenuOpenChange(true)}
        explore={explore}
      />
    </>
  );
}
