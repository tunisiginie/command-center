/** A single launcher tile. The list lives in src/lib/tiles-data.ts. */
export interface Tile {
  id: string;
  label: string;
  /** Optional one-line note shown under the label. Blank keeps the tile minimal. */
  tagline: string | null;
  /** Destination URL. Null means "not built yet" — tile renders dimmed and doesn't navigate. */
  url: string | null;
  /** Image path or URL (e.g. "/tiles/foo.png" from /public), or null for an initial on the accent color. */
  imageUrl: string | null;
  /** Fallback background color (hex) used when there's no image. */
  accent: string;
  position: number;
}
