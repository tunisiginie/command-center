import { Tile } from "@/components/tile";
import type { Tile as TileData } from "@/lib/types";

interface TileGridProps {
  tiles: TileData[];
}

/** Responsive iOS-homescreen-style grid: 3 columns on phone, up to 6 on desktop. */
export function TileGrid({ tiles }: TileGridProps) {
  if (tiles.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
        <p className="text-sm font-medium text-foreground">No tiles yet</p>
        <p className="text-sm text-muted-foreground">
          Add your first app, prototype, or profile link to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {tiles.map((tile) => (
        <Tile key={tile.id} tile={tile} />
      ))}
    </div>
  );
}
