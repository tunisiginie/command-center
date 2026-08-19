"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableTile } from "@/components/sortable-tile";
import { TileEditorSheet } from "@/components/tile-editor-sheet";
import { createClient } from "@/lib/supabase/client";
import {
  createTile,
  updateTile,
  deleteTile,
  reorderTiles,
  uploadTileImage,
  type TileInput,
} from "@/lib/tiles";
import { resizeImageToSquareWebp } from "@/lib/image";
import type { Tile } from "@/lib/types";

interface TileBoardProps {
  initialTiles: Tile[];
  userId: string;
}

/**
 * Client-side owner of the tile grid once a real (non-demo) session exists:
 * local state + optimistic mutations against Supabase, the edit-mode /
 * drag-reorder toggle, and the add/edit sheet. Reordering uses the same
 * dnd-kit PointerSensor tuning (200ms delay, 5px tolerance) as
 * category-accordions.tsx in portfolio-dashboard — proven to distinguish a
 * tap from a drag start on touch.
 */
export function TileBoard({ initialTiles, userId }: TileBoardProps) {
  const [tiles, setTiles] = useState<Tile[]>(initialTiles);
  const [editMode, setEditMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTile, setEditingTile] = useState<Tile | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function openCreate() {
    setEditingTile(null);
    setEditorOpen(true);
  }

  function openEdit(tile: Tile) {
    setEditingTile(tile);
    setEditorOpen(true);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = tiles.map((t) => t.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(tiles, oldIndex, newIndex).map((t, i) => ({
      ...t,
      position: i,
    }));
    const previous = tiles;
    setTiles(reordered); // optimistic — feels instant while the write lands

    try {
      const supabase = createClient();
      await reorderTiles(
        supabase,
        userId,
        reordered.map((t) => ({ id: t.id, position: t.position })),
      );
    } catch {
      setTiles(previous);
      toast.error("Couldn't save the new order.");
    }
  }

  async function handleSave(input: TileInput, imageFile: File | null) {
    const supabase = createClient();
    try {
      if (editingTile) {
        let imagePath: string | undefined;
        if (imageFile) {
          const blob = await resizeImageToSquareWebp(imageFile);
          imagePath = await uploadTileImage(supabase, userId, editingTile.id, blob);
        }
        const updated = await updateTile(supabase, editingTile.id, {
          ...input,
          ...(imagePath ? { imagePath } : {}),
        });
        setTiles((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast.success("Tile updated.");
      } else {
        const created = await createTile(supabase, userId, input);
        let finalTile = created;
        if (imageFile) {
          const blob = await resizeImageToSquareWebp(imageFile);
          const imagePath = await uploadTileImage(supabase, userId, created.id, blob);
          finalTile = await updateTile(supabase, created.id, { imagePath });
        }
        setTiles((prev) => [...prev, finalTile]);
        toast.success("Tile added.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the tile.");
      throw err;
    }
  }

  async function handleDelete(tile: Tile) {
    const supabase = createClient();
    try {
      await deleteTile(supabase, userId, tile.id);
      setTiles((prev) => prev.filter((t) => t.id !== tile.id));
      toast.success(`Removed ${tile.label}.`);
    } catch (err) {
      toast.error("Couldn't remove the tile.");
      throw err;
    }
  }

  /** The ✕ overlay skips the full sheet — same confirm, one less tap. */
  function handleQuickDelete(tile: Tile) {
    if (!window.confirm(`Remove "${tile.label}" from your Command Center?`)) return;
    void handleDelete(tile);
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Command Center</h1>
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          className="text-sm font-medium text-primary"
        >
          {editMode ? "Done" : "Edit"}
        </button>
      </div>

      {tiles.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tiles.map((t) => t.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {tiles.map((tile) => (
                <SortableTile
                  key={tile.id}
                  tile={tile}
                  editMode={editMode}
                  onEdit={openEdit}
                  onDelete={handleQuickDelete}
                />
              ))}
              <AddTileButton onClick={openCreate} />
            </div>
          </SortableContext>
        </DndContext>
      )}

      <TileEditorSheet
        tile={editingTile}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSave}
        onDelete={editingTile ? () => handleDelete(editingTile) : undefined}
      />
    </>
  );
}

function AddTileButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center">
      <span className="flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
        <PlusIcon className="size-6" />
      </span>
      <span className="mt-1.5 text-xs font-medium text-muted-foreground">Add</span>
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <p className="text-sm font-medium text-foreground">No tiles yet</p>
      <p className="text-sm text-muted-foreground">
        Add your first app, prototype, or profile link to get started.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 flex aspect-square w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground"
      >
        <PlusIcon className="size-6" />
      </button>
    </div>
  );
}
