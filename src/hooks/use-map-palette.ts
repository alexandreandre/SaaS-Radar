"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  getHeatColor,
  getHeatColorAmbient,
  getHeatLegend,
  getMapColors,
  type MapPalette,
} from "@/lib/map-colors";

export function useMapPalette() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return useMemo(() => {
    const colors: MapPalette = getMapColors(isDark);
    return {
      isDark,
      colors,
      getHeatColor: (score: number) => getHeatColor(score, isDark),
      getHeatColorAmbient: (score: number) => getHeatColorAmbient(score, isDark),
      heatLegend: getHeatLegend(isDark),
    };
  }, [isDark]);
}
