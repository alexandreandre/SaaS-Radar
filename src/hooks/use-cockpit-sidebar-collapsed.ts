"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cockpit-sidebar-collapsed";

export function useCockpitSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setCollapsedState(true);
    }
    setHydrated(true);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  return { collapsed, setCollapsed, hydrated };
}
