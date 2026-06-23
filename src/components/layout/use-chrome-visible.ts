"use client";

import { useEffect, useState } from "react";

/** Masque le chrome flottant quand l'ancre hero sort du viewport. */
export function useChromeVisible(anchorId?: string | null) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!anchorId) {
      setVisible(true);
      return;
    }

    const anchor = document.getElementById(anchorId);
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorId]);

  return visible;
}
