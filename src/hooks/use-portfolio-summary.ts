"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/contexts/session-context";

type PortfolioSummary = {
  overdueCheckIns: number;
  projectCount: number;
};

const EMPTY: PortfolioSummary = { overdueCheckIns: 0, projectCount: 0 };

/**
 * Hook léger pour la navbar marketing — évite d'importer portfolio-context.
 * Dans le workspace, préférer usePortfolio().overdueCheckIns si déjà monté.
 */
export function usePortfolioSummary(enabled = true): PortfolioSummary & { hydrated: boolean } {
  const { isAuthenticated } = useSession();
  const [summary, setSummary] = useState<PortfolioSummary>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      setSummary(EMPTY);
      setHydrated(true);
      return;
    }

    let active = true;
    void fetch("/api/portfolio/summary")
      .then((res) => (res.ok ? res.json() : EMPTY))
      .then((data: PortfolioSummary) => {
        if (active) {
          setSummary({
            overdueCheckIns: data.overdueCheckIns ?? 0,
            projectCount: data.projectCount ?? 0,
          });
          setHydrated(true);
        }
      })
      .catch(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [enabled, isAuthenticated]);

  return { ...summary, hydrated };
}
