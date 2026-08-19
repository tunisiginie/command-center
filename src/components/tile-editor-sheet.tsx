"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tile } from "@/lib/types";
import type { TileInput } from "@/lib/tiles";

// House chart palette from globals.css, plus the brand primary and destructive —
// a fixed swatch set is simpler and faster to pick from than a raw color input.
const ACCENTS = [
  "#2a41ba",
  "#00c805",
  "#1cc9b0",
  "#5b7cfa",
  "#f5a623",
  "#8e96a3",
  "#ff5000",
];

interface TileEditorSheetProps {
  /** Tile being edited, or null when creating a new one. */
  tile: Tile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: TileInput, imageFile: File | null) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function TileEditorSheet({
  tile,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: TileEditorSheetProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // (Re)load fields whenever the sheet opens, for this tile (or a blank one).
  useEffect(() => {
    if (!open) return;
    setLabel(tile?.label ?? "");
    setUrl(tile?.url ?? "");
    setTagline(tile?.tagline ?? "");
    setAccent(tile?.accent ?? ACCENTS[0]);
    setImageFile(null);
    setImagePreview(tile?.imageUrl ?? null);
  }, [open, tile]);

  function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      await onSave(
        {
          label: label.trim(),
          url: url.trim() || null,
          tagline: tagline.trim() || null,
          accent,
        },
        imageFile,
      );
      onOpenChange(false);
    } catch {
      // Already reported via toast by the caller — keep the sheet open so the edits aren't lost.
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm(`Remove "${tile?.label}" from your Command Center?`)) return;
    setSaving(true);
    try {
      await onDelete();
      onOpenChange(false);
    } catch {
      // Already reported via toast by the caller.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-sm">
        <DialogHeader>
          <DialogTitle>{tile ? "Edit tile" : "Add tile"}</DialogTitle>
          <DialogDescription>
            {tile
              ? "Update this tile's name, link, or artwork."
              : "Leave the link blank for things you haven't built yet — the tile stays dimmed until you add one."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="glass relative aspect-square w-16 shrink-0 overflow-hidden rounded-2xl"
              style={!imagePreview ? { backgroundColor: accent } : undefined}
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="" fill className="object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-white">
                  {label.trim().charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </button>
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? "Change image" : "Upload image"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePickImage}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Optional — falls back to an initial on a color.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tile-label">Name</Label>
            <Input
              id="tile-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Net Worth"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tile-url">Link</Label>
            <Input
              id="tile-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tile-tagline">Tagline (optional)</Label>
            <Input
              id="tile-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Portfolio dashboard"
            />
          </div>

          {!imagePreview && (
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2">
                {ACCENTS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setAccent(hex)}
                    className={cn(
                      "size-7 rounded-full ring-2 ring-offset-2 ring-offset-popover",
                      accent === hex ? "ring-foreground" : "ring-transparent",
                    )}
                    style={{ backgroundColor: hex }}
                    aria-label={hex}
                  />
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            {tile && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-danger mr-auto"
                onClick={handleDelete}
                disabled={saving}
              >
                Remove
              </Button>
            ) : null}
            <Button type="submit" disabled={saving || !label.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
