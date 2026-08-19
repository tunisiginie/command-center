import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Tile as TileData } from "@/lib/types";

interface TileProps {
  tile: TileData;
  className?: string;
}

/**
 * One launcher icon: image (or initial-on-accent fallback) + label + optional
 * tagline. A tile with no `url` (not built yet) renders inert and dimmed
 * instead of linking anywhere.
 *
 * Deliberately a plain `<a href>` with no `target` — inside an installed
 * `display: standalone` PWA on iOS 16.4+, that's what makes the destination
 * open as an in-app overlay (swipe down to return) instead of kicking out to
 * Safari. `target="_blank"` breaks that behavior, so don't add one here.
 */
export function Tile({ tile, className }: TileProps) {
  const isLive = Boolean(tile.url);
  const initial = tile.label.trim().charAt(0).toUpperCase() || "?";

  const icon = (
    <div
      className="glass tile-touch relative aspect-square w-full overflow-hidden rounded-2xl"
      style={!tile.imageUrl ? { backgroundColor: tile.accent } : undefined}
    >
      {tile.imageUrl ? (
        <Image
          src={tile.imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 33vw, 160px"
          className="object-cover"
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center font-heading text-3xl font-semibold text-white"
          aria-hidden
        >
          {initial}
        </span>
      )}
    </div>
  );

  const labelBlock = (
    <div className="mt-1.5 w-full text-center">
      <p className="truncate text-xs font-medium text-foreground">{tile.label}</p>
      {tile.tagline ? (
        <p className="truncate text-[11px] text-muted-foreground">{tile.tagline}</p>
      ) : null}
    </div>
  );

  if (!isLive) {
    return (
      <div
        className={cn("flex flex-col items-center opacity-40", className)}
        aria-disabled="true"
        title="Not built yet"
      >
        {icon}
        {labelBlock}
      </div>
    );
  }

  return (
    <a
      href={tile.url!}
      className={cn(
        "flex flex-col items-center transition-transform active:scale-95",
        className,
      )}
    >
      {icon}
      {labelBlock}
    </a>
  );
}
