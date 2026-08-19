/** A single launcher tile. Mirrors the `public.tiles` Supabase table (see supabase/schema.sql). */
export interface Tile {
  id: string;
  label: string;
  /** Optional one-line note shown under the label. Blank keeps the tile minimal. */
  tagline: string | null;
  /** Destination URL. Null means "not built yet" — tile renders dimmed and doesn't navigate. */
  url: string | null;
  /** Public URL of the uploaded tile image, or null to fall back to an initial + accent color. */
  imageUrl: string | null;
  /** Fallback background color (hex) used when there's no image. */
  accent: string;
  position: number;
}
