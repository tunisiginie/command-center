import type { Tile } from "@/lib/types";

/**
 * Placeholder tiles for Phase 1 (no backend yet). Real tiles will come from
 * Supabase starting in Phase 2 — see src/lib/tiles.ts. Kept here so the grid,
 * card, and empty-state UI all have something real to render against while
 * the data layer isn't wired up.
 */
export const SEED_TILES: Tile[] = [
  {
    id: "seed-portfolio",
    label: "Net Worth",
    tagline: "Portfolio dashboard",
    url: null, // fill in with the Vercel URL
    imageUrl: null,
    accent: "#2a41ba",
    position: 0,
  },
  {
    id: "seed-rent-a-pro",
    label: "Rent a Pro",
    tagline: "Instant expert advice",
    url: null, // fill in with the Vercel URL
    imageUrl: null,
    accent: "#00c805",
    position: 1,
  },
  {
    id: "seed-idea-board",
    label: "Idea Board",
    tagline: null,
    url: null, // fill in with the claude.ai artifact link
    imageUrl: null,
    accent: "#f5a623",
    position: 2,
  },
  {
    id: "seed-linkedin",
    label: "LinkedIn",
    tagline: null,
    url: null, // fill in with the profile URL
    imageUrl: null,
    accent: "#0a66c2",
    position: 3,
  },
  {
    id: "seed-ai-teacher",
    label: "AI Teacher",
    tagline: "Not built yet",
    url: null, // stays dimmed until this exists
    imageUrl: null,
    accent: "#8e96a3",
    position: 4,
  },
];
