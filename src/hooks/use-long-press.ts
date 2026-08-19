"use client";

import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  /** ms to hold before firing. 500 matches iOS's own long-press timing. */
  delay?: number;
  /** px of movement that cancels a pending long-press (a drag, not a hold). */
  moveThreshold?: number;
}

/**
 * Long-press detection for the tile actions sheet (copy link / QR), kept
 * separate from dnd-kit's drag gesture — this only runs outside edit mode,
 * dnd-kit's PointerSensor only runs inside it, so the two never compete for
 * the same touch.
 */
export function useLongPress({ onLongPress, delay = 500, moveThreshold = 10 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      firedRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY };
      clear();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress();
      }, delay);
    },
    [clear, delay, onLongPress],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > moveThreshold) clear();
    },
    [clear, moveThreshold],
  );

  /** Swallows the click that follows a fired long-press, so the tile doesn't also navigate. */
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (firedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      firedRef.current = false;
    }
  }, []);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onClickCapture,
    onContextMenu,
  };
}
