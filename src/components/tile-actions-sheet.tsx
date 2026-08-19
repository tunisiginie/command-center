"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Tile } from "@/lib/types";

interface TileActionsSheetProps {
  tile: Tile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Long-press sheet: copy the link or show a QR for it — handy when showing a tile to someone in person. */
export function TileActionsSheet({ tile, open, onOpenChange }: TileActionsSheetProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const url = tile?.url ?? null;

  useEffect(() => {
    if (!open || !url) return;
    let cancelled = false;
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });
    return () => {
      cancelled = true;
      // Clears on close (unmount of this effect's run) and before the next
      // tile's QR resolves, so a stale code never lingers on screen.
      setQrDataUrl(null);
    };
  }, [open, url]);

  async function handleCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-sm">
        <DialogHeader>
          <DialogTitle>{tile?.label}</DialogTitle>
          {url ? <DialogDescription className="break-all">{url}</DialogDescription> : null}
        </DialogHeader>

        {qrDataUrl ? (
          <div className="flex justify-center py-2">
            <Image
              src={qrDataUrl}
              alt={`QR code for ${tile?.label}`}
              width={200}
              height={200}
              unoptimized
              className="rounded-lg"
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            Copy link
          </Button>
          {url ? <Button render={<a href={url} />}>Open</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
