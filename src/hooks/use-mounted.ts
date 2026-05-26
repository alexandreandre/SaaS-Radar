"use client";

import { useEffect, useState } from "react";

/** True après le premier paint client — évite les écarts SSR / hydratation. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
