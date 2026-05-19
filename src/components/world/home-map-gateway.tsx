"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WorldMapHero } from "@/components/world/world-map-hero";
import { WorldMapExplorer } from "@/components/world/world-map";
import { TargetMarketProvider } from "@/context/target-market-context";

function MapExplorerOverlay({
  initialCountry,
  onClose,
}: {
  initialCountry: string | null;
  onClose: () => void;
}) {
  return <WorldMapExplorer embedded initialCountry={initialCountry} onClose={onClose} />;
}

export function HomeMapGateway() {
  const [open, setOpen] = useState(false);
  const [initialCountry, setInitialCountry] = useState<string | null>(null);

  const activate = useCallback((code?: string) => {
    setInitialCountry(code ?? null);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setInitialCountry(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <TargetMarketProvider>
      <WorldMapHero onActivate={activate} className="absolute inset-0 z-0" />

      <AnimatePresence>
        {open && (
          <motion.div
            key="map-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
          >
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center bg-[#0A0A0A] text-zinc-500">
                  Chargement de la carte…
                </div>
              }
            >
              <MapExplorerOverlay initialCountry={initialCountry} onClose={close} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </TargetMarketProvider>
  );
}
