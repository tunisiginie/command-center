import type { TileInput } from "@/lib/tiles";

/**
 * First-run tile set, offered as a one-tap seed from the empty state.
 *
 * Entries with a null `url` are intentional: they render dimmed and inert
 * until a link is filled in (see `Tile` in src/components/tile.tsx). That's
 * how "I haven't built this yet" is represented — the tile exists as a
 * placeholder so it can be reordered and re-skinned now, and lights up the
 * moment a URL is added.
 */
export const STARTER_TILES: TileInput[] = [
  {
    label: "Net Worth",
    tagline: "Portfolio dashboard",
    url: "https://portfolio-dashboard-eight-beta.vercel.app/",
    accent: "#2a41ba",
  },
  {
    label: "Rent a Pro",
    tagline: "Instant expert advice",
    url: "https://rent-a-pro-zeta.vercel.app",
    accent: "#00c805",
  },
  {
    label: "Idea Board",
    tagline: null,
    url: "https://claude.ai/chat/299a716d-9769-4998-9b91-8f04a347f24a?artifactId=idea-board-v5.html&versionUuid=8668f923-9c6f-4d7c-964e-3ad91dbf119a",
    accent: "#f5a623",
  },
  {
    label: "LinkedIn",
    tagline: null,
    url: null, // add your profile URL to light this up
    accent: "#0a66c2",
  },
  {
    label: "AI Teacher",
    tagline: "Not built yet",
    url: null,
    accent: "#8e96a3",
  },
];
