/** Tile size preference — controls how many columns the grid packs in. */
export const DENSITIES = ["s", "m", "l"] as const;
export type Density = (typeof DENSITIES)[number];

export const DENSITY_LABEL: Record<Density, string> = {
  s: "S",
  m: "M",
  l: "L",
};

/** Smaller tiles = more columns. Mirrors the original Phase 1 grid at "m". */
const GRID_CLASSES: Record<Density, string> = {
  s: "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8",
  m: "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
  l: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
};

export function gridClass(density: Density): string {
  return GRID_CLASSES[density];
}
