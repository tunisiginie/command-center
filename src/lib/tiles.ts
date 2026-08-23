import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tile } from "@/lib/types";

export const IMAGE_BUCKET = "tile-images";

/**
 * This app has no login: there is a single shared board, and every read and
 * write goes through the public anon key against permissive RLS policies
 * (see supabase/schema.sql). Nothing here is user-scoped — the `user_id`
 * column still exists on the table but is left null.
 */

/** Raw shape of a `public.tiles` row — see supabase/schema.sql. */
interface TileRow {
  id: string;
  label: string;
  tagline: string | null;
  url: string | null;
  image_path: string | null;
  accent: string;
  position: number;
}

export interface TileInput {
  label: string;
  tagline?: string | null;
  url?: string | null;
  imagePath?: string | null;
  accent?: string;
}

function toTile(row: TileRow, supabase: SupabaseClient): Tile {
  return {
    id: row.id,
    label: row.label,
    tagline: row.tagline,
    url: row.url,
    imageUrl: row.image_path
      ? supabase.storage.from(IMAGE_BUCKET).getPublicUrl(row.image_path).data.publicUrl
      : null,
    accent: row.accent,
    position: row.position,
  };
}

/** Every tile, in display order. */
export async function getTiles(supabase: SupabaseClient): Promise<Tile[]> {
  const { data, error } = await supabase
    .from("tiles")
    .select("id, label, tagline, url, image_path, accent, position")
    .order("position", { ascending: true });

  if (error) throw error;
  return (data as TileRow[]).map((row) => toTile(row, supabase));
}

export async function createTile(
  supabase: SupabaseClient,
  input: TileInput,
): Promise<Tile> {
  // New tiles go to the end of the list.
  const { data: existing, error: countError } = await supabase
    .from("tiles")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);
  if (countError) throw countError;
  const nextPosition = existing?.length ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from("tiles")
    .insert({
      label: input.label,
      tagline: input.tagline ?? null,
      url: input.url ?? null,
      image_path: input.imagePath ?? null,
      accent: input.accent ?? "#2a41ba",
      position: nextPosition,
    })
    .select("id, label, tagline, url, image_path, accent, position")
    .single();

  if (error) throw error;
  return toTile(data as TileRow, supabase);
}

export async function updateTile(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<TileInput>,
): Promise<Tile> {
  const { data, error } = await supabase
    .from("tiles")
    .update({
      ...(patch.label !== undefined ? { label: patch.label } : {}),
      ...(patch.tagline !== undefined ? { tagline: patch.tagline } : {}),
      ...(patch.url !== undefined ? { url: patch.url } : {}),
      ...(patch.imagePath !== undefined ? { image_path: patch.imagePath } : {}),
      ...(patch.accent !== undefined ? { accent: patch.accent } : {}),
    })
    .eq("id", id)
    .select("id, label, tagline, url, image_path, accent, position")
    .single();

  if (error) throw error;
  return toTile(data as TileRow, supabase);
}

export async function deleteTile(supabase: SupabaseClient, id: string): Promise<void> {
  // Best-effort image cleanup first — an orphaned storage object is harmless
  // clutter, but if this fails we'd still rather delete the tile than block
  // on it, so failures here are swallowed.
  await supabase.storage.from(IMAGE_BUCKET).remove([`tiles/${id}.webp`]);

  const { error } = await supabase.from("tiles").delete().eq("id", id);
  if (error) throw error;
}

/** Uploads a resized tile image and returns the storage path to save on the tile row. */
export async function uploadTileImage(
  supabase: SupabaseClient,
  tileId: string,
  blob: Blob,
): Promise<string> {
  const path = `tiles/${tileId}.webp`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, blob, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/**
 * Persists a full reorder as parallel per-row position updates. Deliberately
 * not `upsert` — every id here refers to an existing tile, and an upsert's
 * INSERT branch would trip the NOT NULL constraint on `label` since only
 * `position` is supplied.
 */
export async function reorderTiles(
  supabase: SupabaseClient,
  order: { id: string; position: number }[],
): Promise<void> {
  const results = await Promise.all(
    order.map(({ id, position }) =>
      supabase.from("tiles").update({ position }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}


/**
 * Bulk-inserts tiles in one round trip, positioned starting at
 * `startPosition`. Not a loop over `createTile` — that re-queries the max
 * position on every call, turning a batch of N tiles into 2N round trips.
 * Used by both the first-run starter seed and the multi-URL quick-add.
 */
export async function insertTiles(
  supabase: SupabaseClient,
  inputs: TileInput[],
  startPosition = 0,
): Promise<Tile[]> {
  const { data, error } = await supabase
    .from("tiles")
    .insert(
      inputs.map((input, i) => ({
        label: input.label,
        tagline: input.tagline ?? null,
        url: input.url ?? null,
        image_path: input.imagePath ?? null,
        accent: input.accent ?? "#2a41ba",
        position: startPosition + i,
      })),
    )
    .select("id, label, tagline, url, image_path, accent, position");

  if (error) throw error;
  return (data as TileRow[]).map((row) => toTile(row, supabase));
}

/** Highest `position` currently in use, or -1 if the board is empty. */
export async function getMaxPosition(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from("tiles")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.length ? data[0].position : -1;
}

/** First-run starter set — thin wrapper so call sites read intent-first. */
export function seedStarterTiles(supabase: SupabaseClient, inputs: TileInput[]): Promise<Tile[]> {
  return insertTiles(supabase, inputs, 0);
}
