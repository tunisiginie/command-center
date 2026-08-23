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
import { TileActionsSheet } from "@/components/tile-actions-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { DensityToggle } from "@/components/density-toggle";
import { createClient } from "@/lib/supabase/client";
import {
  createTile,
  updateTile,
  deleteTile,
  reorderTiles,
  uploadTileImage,
  seedStarterTiles,
  insertTiles,
  getMaxPosition,
  type TileInput,
} from "@/lib/tiles";
import { QuickAddSheet } from "@/components/quick-add-sheet";
import { ACCENTS } from "@/lib/accents";
import { STARTER_TILES } from "@/lib/starter-tiles";
import { Button } from "@/components/ui/button";
import { resizeImageToSquareWebp } from "@/lib/image";
import { useTileDensity } from "@/hooks/use-tile-density";
import { gridClass } from "@/lib/grid-density";
import { cn } from "@/lib/utils";
import type { Tile } from "@/lib/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface TileBoardProps {
  initialTiles: Tile[];
}

/**
 * Client-side owner of the tile grid once a real (non-demo) session exists:
 * local state + optimistic mutations against Supabase, the edit-mode /
 * drag-reorder toggle, and the add/edit sheet. Reordering uses the same
 * dnd-kit PointerSensor tuning (200ms delay, 5px tolerance) as
 * category-accordions.tsx in portfolio-dashboard — proven to distinguish a
 * tap from a drag start on touch.
 */
export function TileBoard({ initialTiles }: TileBoardProps) {
  const [tiles, setTiles] = useState<Tile[]>(initialTiles);
  const [editMode, setEditMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTile, setEditingTile] = useState<Tile | null>(null);
  const [actionsTile, setActionsTile] = useState<Tile | null>(null);
  const [density, setDensity] = useTileDensity();
  const [seeding, setSeeding] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

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
          imagePath = await uploadTileImage(supabase, editingTile.id, blob);
        }
        const updated = await updateTile(supabase, editingTile.id, {
          ...input,
          ...(imagePath ? { imagePath } : {}),
        });
        setTiles((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast.success("Tile updated.");
      } else {
        const created = await createTile(supabase, input);
        let finalTile = created;
        if (imageFile) {
          const blob = await resizeImageToSquareWebp(imageFile);
          const imagePath = await uploadTileImage(supabase, created.id, blob);
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
      await deleteTile(supabase, tile.id);
      setTiles((prev) => prev.filter((t) => t.id !== tile.id));
      toast.success(`Removed ${tile.label}.`);
    } catch (err) {
      toast.error("Couldn't remove the tile.");
      throw err;
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const created = await seedStarterTiles(createClient(), STARTER_TILES);
      setTiles(created);
      toast.success("Starter tiles added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add the starter tiles.");
    } finally {
      setSeeding(false);
    }
  }

  async function handleQuickAdd(inputs: TileInput[]) {
    const supabase = createClient();
    try {
      const startPosition = (await getMaxPosition(supabase)) + 1;
      const created = await insertTiles(supabase, inputs, startPosition);
      setTiles((prev) => [...prev, ...created]);
      toast.success(`Added ${created.length} tile${created.length === 1 ? "" : "s"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add those tiles.");
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-xl font-semibold text-foreground">Command Center</h1>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <DensityToggle density={density} onChange={setDensity} />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className="text-sm font-medium text-primary"
          >
            {editMode ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {tiles.length === 0 ? (
        <EmptyState
          onAdd={openCreate}
          onSeed={handleSeed}
          seeding={seeding}
          onQuickAdd={() => setQuickAddOpen(true)}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tiles.map((t) => t.id)} strategy={rectSortingStrategy}>
            <div className={cn("grid gap-x-4 gap-y-6", gridClass(density))}>
              {tiles.map((tile) => (
                <SortableTile
                  key={tile.id}
                  tile={tile}
                  editMode={editMode}
                  onEdit={openEdit}
                  onDelete={handleQuickDelete}
                  onLongPress={setActionsTile}
                />
              ))}
              <AddTileButton onClick={openCreate} />
            </div>
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="mt-3 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              Quick add multiple links
            </button>
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

      <TileActionsSheet
        tile={actionsTile}
        open={actionsTile !== null}
        onOpenChange={(o) => !o && setActionsTile(null)}
      />

      <QuickAddSheet
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        accentOffset={tiles.length % ACCENTS.length}
        onAdd={handleQuickAdd}
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

function EmptyState({
  onAdd,
  onSeed,
  seeding,
  onQuickAdd,
}: {
  onAdd: () => void;
  onSeed: () => void;
  seeding: boolean;
  onQuickAdd: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <p className="text-sm font-medium text-foreground">No tiles yet</p>
      <p className="text-sm text-muted-foreground">
        Start with your existing apps, or add one from scratch.
      </p>
      <Button className="mt-2" onClick={onSeed} disabled={seeding}>
        {seeding ? "Adding…" : "Add starter tiles"}
      </Button>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 flex aspect-square w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground"
        aria-label="Add a tile from scratch"
      >
        <PlusIcon className="size-6" />
      </button>
      <button
        type="button"
        onClick={onQuickAdd}
        className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
      >
        Or paste in several links at once
      </button>
    </div>
  );
}
