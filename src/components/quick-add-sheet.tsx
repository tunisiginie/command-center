"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TileInput } from "@/lib/tiles";
import { ACCENTS } from "@/lib/accents";
import { labelFromUrl } from "@/lib/url-label";

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cycling starts here so a batch doesn't repeat colors already on the board. */
  accentOffset: number;
  onAdd: (inputs: TileInput[]) => Promise<void>;
}

/**
 * One line per tile: bare `https://…` gets a guessed name (see
 * lib/url-label.ts), or `Name | https://…` to set it explicitly. Blank
 * lines and lines that fail to parse as a URL are skipped rather than
 * rejecting the whole paste — a batch of ten shouldn't fail over one typo.
 */
function parseLines(raw: string, accentOffset: number): TileInput[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line, i): TileInput[] => {
      const pipeIndex = line.indexOf("|");
      const namePart = pipeIndex >= 0 ? line.slice(0, pipeIndex).trim() : "";
      const urlPart = (pipeIndex >= 0 ? line.slice(pipeIndex + 1) : line).trim();

      let url: string;
      try {
        url = new URL(urlPart).toString();
      } catch {
        return []; // not a valid URL — skip rather than fail the whole paste
      }

      const label = namePart || labelFromUrl(url) || "Untitled";
      return [{ label, url, accent: ACCENTS[(accentOffset + i) % ACCENTS.length] }];
    });
}

export function QuickAddSheet({ open, onOpenChange, accentOffset, onAdd }: QuickAddSheetProps) {
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);

  const parsed = parseLines(raw, accentOffset);
  const lineCount = raw.split("\n").filter((l) => l.trim()).length;
  const skipped = lineCount - parsed.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.length) return;
    setSaving(true);
    try {
      await onAdd(parsed);
      setRaw("");
      onOpenChange(false);
    } catch {
      // Already reported via toast by the caller — keep the sheet open so the paste isn't lost.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setRaw("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="glass max-w-sm">
        <DialogHeader>
          <DialogTitle>Quick add</DialogTitle>
          <DialogDescription>
            One link per line. Add a name with a pipe: <code>Name | https://…</code> — otherwise
            one gets guessed from the link. Rename or restyle any tile afterward.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="quick-add-urls">Links</Label>
            <textarea
              id="quick-add-urls"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={"https://example.com\nIdea Board | https://claude.ai/public/artifacts/…"}
              rows={6}
              className="w-full resize-none rounded-lg border border-input bg-secondary px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground">
              {parsed.length > 0
                ? `${parsed.length} tile${parsed.length === 1 ? "" : "s"} ready` +
                  (skipped > 0 ? ` · ${skipped} line${skipped === 1 ? "" : "s"} skipped (not a valid link)` : "")
                : "Paste one or more links to preview them here."}
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving || !parsed.length}>
              {saving
                ? "Adding…"
                : `Add ${parsed.length || ""} tile${parsed.length === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
