"use client";

import { useState } from "react";
import { Tile } from "@/components/tile";
import { TileActionsSheet } from "@/components/tile-actions-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { DensityToggle } from "@/components/density-toggle";
import { useLongPress } from "@/hooks/use-long-press";
import { useTileDensity } from "@/hooks/use-tile-density";
import { gridClass } from "@/lib/grid-density";
import { cn } from "@/lib/utils";
import type { Tile as TileData } from "@/lib/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * A tile plus its long-press gesture (copy link / QR). Only tiles with a link
 * get the gesture — a dimmed "not built yet" tile has nothing to copy.
 */
function LaunchTile({ tile, onLongPress }: { tile: TileData; onLongPress: (t: TileData) => void }) {
  const longPress = useLongPress({ onLongPress: () => onLongPress(tile) });
  return (
    <div {...(tile.url ? longPress : {})}>
      <Tile tile={tile} />
    </div>
  );
}

/**
 * The launcher grid. Tiles come from src/lib/tiles-data.ts; this component
 * only owns view state (tile size, which tile's actions sheet is open), so it
 * has no way to fail on a backend.
 */
export function TileBoard({ tiles }: { tiles: TileData[] }) {
  const [density, setDensity] = useTileDensity();
  const [actionsTile, setActionsTile] = useState<TileData | null>(null);

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-xl font-semibold text-foreground">Command Center</h1>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <DensityToggle density={density} onChange={setDensity} />
          <ThemeToggle />
        </div>
      </div>

      <div className={cn("grid gap-x-4 gap-y-6", gridClass(density))}>
        {tiles.map((tile) => (
          <LaunchTile key={tile.id} tile={tile} onLongPress={setActionsTile} />
        ))}
      </div>

      <TileActionsSheet
        tile={actionsTile}
        open={actionsTile !== null}
        onOpenChange={(o) => !o && setActionsTile(null)}
      />
    </>
  );
}
