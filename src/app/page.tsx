import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getTiles } from "@/lib/tiles";
import { TileGrid } from "@/components/tile-grid";
import { TileBoard } from "@/components/tile-board";
import { ThemeToggle } from "@/components/theme-toggle";
import { SEED_TILES } from "@/lib/seed-tiles";

// Always read fresh from Supabase — tiles change from any device.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Without Supabase env vars, show the seed tiles read-only so the shell
  // still renders standalone.
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Command Center</h1>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Demo — not connected</span>
            <ThemeToggle />
          </div>
        </header>
        <TileGrid tiles={SEED_TILES} />
      </main>
    );
  }

  // No auth: a single shared board, open to anyone with the URL. Reads and
  // writes go through the anon key against permissive RLS policies.
  const supabase = await createClient();
  const tiles = await getTiles(supabase);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <TileBoard initialTiles={tiles} />
    </main>
  );
}
