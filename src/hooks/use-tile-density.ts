"use client";

import { useEffect, useState } from "react";
import { DENSITIES, type Density } from "@/lib/grid-density";

const STORAGE_KEY = "command-center:tile-density";

/**
 * Per-device tile size preference. Deliberately localStorage, not Supabase —
 * this is a "how it looks on this screen" setting, not board data that
 * needs to follow you across devices.
 */
export function useTileDensity(): [Density, (d: Density) => void] {
  const [density, setDensityState] = useState<Density>("m");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (DENSITIES as readonly string[]).includes(stored)) {
      setDensityState(stored as Density);
    }
  }, []);

  function setDensity(d: Density) {
    setDensityState(d);
    window.localStorage.setItem(STORAGE_KEY, d);
  }

  return [density, setDensity];
}
