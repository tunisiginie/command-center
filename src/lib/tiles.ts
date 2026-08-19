import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tile } from "@/lib/types";

const IMAGE_BUCKET = "tile-images";

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

/** All of a user's tiles, in display order. */
export async function getTiles(supabase: SupabaseClient, userId: string): Promise<Tile[]> {
  const { data, error } = await supabase
    .from("tiles")
    .select("id, label, tagline, url, image_path, accent, position")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data as TileRow[]).map((row) => toTile(row, supabase));
}

export async function createTile(
  supabase: SupabaseClient,
  userId: string,
  input: TileInput,
): Promise<Tile> {
  // New tiles go to the end of the list.
  const { data: existing, error: countError } = await supabase
    .from("tiles")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1);
  if (countError) throw countError;
  const nextPosition = existing?.length ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from("tiles")
    .insert({
      user_id: userId,
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
  const { error } = await supabase.from("tiles").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Persists a full reorder as parallel per-row position updates, scoped to
 * `userId` via RLS. Deliberately not `upsert` — every id here refers to an
 * existing tile, and an upsert's INSERT branch would trip the NOT NULL
 * constraint on `label` since only `position` is supplied.
 */
export async function reorderTiles(
  supabase: SupabaseClient,
  userId: string,
  order: { id: string; position: number }[],
): Promise<void> {
  const results = await Promise.all(
    order.map(({ id, position }) =>
      supabase.from("tiles").update({ position }).eq("id", id).eq("user_id", userId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
