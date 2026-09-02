"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Without this, an unhandled server-render error (like
 * the database being unreachable) falls through to Next's default error
 * screen — a dead end with no way back in short of a manual reload.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <h1 className="text-base font-semibold text-foreground">Command Center</h1>
      <p className="text-sm text-muted-foreground">Something went wrong loading the board.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
