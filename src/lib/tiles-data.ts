import type { Tile } from "@/lib/types";

/**
 * The launcher's tiles. This is the whole "database": add, remove, or reorder
 * entries here and redeploy. There is deliberately no backend — a list this
 * small that changes about once a month doesn't justify a service that can
 * pause, be deleted, or be misconfigured (all three have happened).
 *
 * - Order in this array is display order.
 * - `url: null` renders the tile dimmed and inert ("not built yet"); fill in a
 *   URL and it lights up.
 * - Use public links only. A claude.ai/chat/... URL is private and 403s for
 *   everyone but you; publish the artifact and use its claude.ai/artifact/...
 *   link instead.
 * - To give a tile real artwork, drop a square image in /public and set
 *   `imageUrl` to its path (e.g. "/tiles/net-worth.png").
 */
export const TILES: Tile[] = [
  {
    id: "net-worth",
    label: "Net Worth",
    tagline: "Portfolio dashboard",
    url: "https://portfolio-dashboard-eight-beta.vercel.app/",
    imageUrl: null,
    accent: "#2a41ba",
    position: 0,
  },
  {
    id: "rent-a-pro",
    label: "Rent a Pro",
    tagline: "Instant expert advice",
    url: "https://rent-a-pro-zeta.vercel.app",
    imageUrl: null,
    accent: "#00c805",
    position: 1,
  },
  {
    id: "idea-board",
    label: "Idea Board",
    tagline: null,
    url: "https://claude.ai/artifact/11xaK1K8YzpWigk192kkzQ",
    imageUrl: null,
    accent: "#f5a623",
    position: 2,
  },
  {
    id: "deal-board",
    label: "Deal Board",
    tagline: "Daily deal alerts",
    url: "https://script.google.com/macros/s/AKfycbwEorO3FSQUE-Y_HwYmr3J5mpzy2muYnPEdGaPNcR-UBo45zUP2C7ALDUARUZxLzWAY/exec?view=board&k=910297e9a3b84866a59c750220b8bed6",
    imageUrl: null,
    accent: "#2c6a5d",
    position: 3,
  },
  {
    id: "linkedin-for-influencers",
    label: "LinkedIn for Influencers",
    tagline: null,
    url: "https://linkedin-for-influencers.vercel.app",
    imageUrl: null,
    accent: "#5b7cfa",
    position: 4,
  },
  {
    id: "ai-professor",
    label: "AI Professor",
    tagline: "ML program",
    url: "https://claude.ai/artifact/HojbwqomyVVxHNn6BwHQ3t",
    imageUrl: null,
    accent: "#1cc9b0",
    position: 5,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    tagline: null,
    url: null, // add your profile URL to light this up
    imageUrl: null,
    accent: "#0a66c2",
    position: 6,
  },
];
