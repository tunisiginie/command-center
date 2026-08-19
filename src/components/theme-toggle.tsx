"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

const ORDER = ["light", "dark", "system"] as const;
type Mode = (typeof ORDER)[number];

const ICONS: Record<Mode, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

/** Cycles light -> dark -> system on tap. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes can't know the resolved theme until it reads localStorage on
  // the client — rendering a real icon before that would mismatch the SSR
  // markup, so hold a same-size placeholder until after mount.
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="size-7" aria-hidden />;

  const current: Mode = (theme as Mode) ?? "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = ICONS[current];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="flex size-7 items-center justify-center rounded-full text-muted-foreground"
      aria-label={`Theme: ${current}. Tap to switch to ${next}.`}
    >
      <Icon className="size-4" />
    </button>
  );
}
