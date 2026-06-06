"use client";

import { useEffect, useState, type ReactNode } from "react";

export function DeferredMapMount({
  immediate,
  children,
  fallback,
}: {
  immediate: boolean;
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [ready, setReady] = useState(immediate);

  useEffect(() => {
    if (immediate) {
      setReady(true);
      return;
    }

    const schedule = () => setReady(true);

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(schedule, { timeout: 500 });
      return () => cancelIdleCallback(id);
    }

    const t = window.setTimeout(schedule, 150);
    return () => window.clearTimeout(t);
  }, [immediate]);

  if (!ready) return fallback;
  return children;
}
