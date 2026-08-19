import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getTiles } from "@/lib/tiles";
import { TileGrid } from "@/components/tile-grid";
import { SEED_TILES } from "@/lib/seed-tiles";
import type { Tile } from "@/lib/types";

export default async function Home() {
  let tiles: Tile[] = SEED_TILES;
  let demoMode = true;

  // Without Supabase env vars this renders the seed tiles unauthenticated —
  // lets Phase 1's shell keep working while Phase 2's env vars aren't set
  // yet. Once configured, every visitor needs a session; RLS means each
  // signed-in user only ever sees and edits their own board.
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    tiles = await getTiles(supabase, user.id);
    demoMode = false;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Command Center</h1>
        {demoMode ? (
          <span className="text-[11px] text-muted-foreground">Demo — not connected</span>
        ) : (
          <a href="/auth/signout" className="text-[11px] text-muted-foreground">
            Sign out
          </a>
        )}
      </header>
      <TileGrid tiles={tiles} />
    </main>
  );
}
