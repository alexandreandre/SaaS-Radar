"use client";

import { useCallback, useEffect, useState } from "react";
import type { Topology } from "topojson-specification";

export const GEO_URL = "/geo/countries-110m.json";

type GeographyStatus = "idle" | "loading" | "ready" | "error";

const RETRY_DELAYS_MS = [500, 1000, 2000];

let cachedTopology: Topology | null = null;
let inflight: Promise<Topology> | null = null;

async function fetchTopology(): Promise<Topology> {
  if (cachedTopology) return cachedTopology;
  if (inflight) return inflight;

  inflight = (async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        const res = await fetch(GEO_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        cachedTopology = (await res.json()) as Topology;
        return cachedTopology;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Échec du chargement");
        if (attempt < RETRY_DELAYS_MS.length) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        }
      }
    }

    throw lastError ?? new Error("Échec du chargement");
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function useGeographyData() {
  const [topology, setTopology] = useState<Topology | null>(() => cachedTopology);
  const [status, setStatus] = useState<GeographyStatus>(() =>
    cachedTopology ? "ready" : "idle"
  );

  const load = useCallback(async (force = false) => {
    if (!force && cachedTopology) {
      setTopology(cachedTopology);
      setStatus("ready");
      return;
    }

    if (force) cachedTopology = null;

    setStatus("loading");
    try {
      const data = await fetchTopology();
      setTopology(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (cachedTopology) {
      setTopology(cachedTopology);
      setStatus("ready");
      return;
    }
    load();
  }, [load]);

  const retry = useCallback(() => {
    load(true);
  }, [load]);

  return { topology, status, retry };
}
