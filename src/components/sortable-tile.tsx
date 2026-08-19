"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PencilIcon, XIcon } from "lucide-react";
import { Tile } from "@/components/tile";
import { useLongPress } from "@/hooks/use-long-press";
import { cn } from "@/lib/utils";
import type { Tile as TileData } from "@/lib/types";

interface SortableTileProps {
  tile: TileData;
  editMode: boolean;
  onEdit: (tile: TileData) => void;
  onDelete: (tile: TileData) => void;
  onLongPress: (tile: TileData) => void;
}

/**
 * Drag-and-drop + edit-mode chrome around a plain <Tile>. Only wired up to
 * dnd-kit's sortable listeners while `editMode` is on, so a normal tap in
 * view mode is never mistaken for a drag start — and the long-press (copy
 * link / QR) gesture only runs the rest of the time, so the two never
 * compete for the same touch.
 */
export function SortableTile({ tile, editMode, onEdit, onDelete, onLongPress }: SortableTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tile.id,
  });

  const longPress = useLongPress({
    onLongPress: () => onLongPress(tile),
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", editMode && "touch-none")}
      {...(editMode ? { ...attributes, ...listeners } : tile.url ? longPress : {})}
    >
      {editMode ? (
        <button
          type="button"
          onClick={() => onEdit(tile)}
          onPointerDown={(e) => e.stopPropagation()}
          className="glass absolute -left-1.5 -top-1.5 z-10 flex size-6 items-center justify-center rounded-full text-foreground"
          aria-label={`Edit ${tile.label}`}
        >
          <PencilIcon className="size-3.5" />
        </button>
      ) : null}
      {editMode ? (
        <button
          type="button"
          onClick={() => onDelete(tile)}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-1.5 -top-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-destructive text-white"
          aria-label={`Remove ${tile.label}`}
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
      <Tile
        tile={tile}
        interactive={!editMode}
        jiggle={editMode && !isDragging}
        className={isDragging ? "opacity-50" : undefined}
      />
    </div>
  );
}
