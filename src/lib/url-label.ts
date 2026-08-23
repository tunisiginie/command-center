/**
 * Best-effort display name for a pasted URL, so bulk-added tiles don't all
 * land as "Untitled". Only ever a guess — every name stays editable.
 */

/** Path segments that carry no meaning as a name. */
const NOISE = new Set(["public", "artifacts", "chat", "share", "p", "s", "app", "index.html"]);

/** Looks like an id rather than a word: uuids, hashes, long opaque tokens. */
function isOpaqueId(segment: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment) || // uuid
    /^[0-9a-f]{12,}$/i.test(segment) || // hex blob
    /^\d+$/.test(segment) || // pure number
    (segment.length > 20 && !segment.includes("-"))
  );
}

function titleCase(raw: string): string {
  return raw
    .replace(/\.[a-z0-9]+$/i, "") // strip a file extension
    .replace(/[-_+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function labelFromUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return "";
  }

  // Prefer the last meaningful path segment — it usually names the thing.
  const segments = parsed.pathname
    .split("/")
    .filter(Boolean)
    .filter((s) => !NOISE.has(s.toLowerCase()) && !isOpaqueId(s));

  const last = segments.at(-1);
  if (last) {
    const name = titleCase(decodeURIComponent(last));
    if (name) return name;
  }

  // Otherwise fall back to the host, dropping www and the TLD. Vercel's
  // generated suffixes (-gamma-kohl, -eight-beta) are noise, but stripping
  // them reliably isn't worth the false positives — the user renames.
  const host = parsed.hostname.replace(/^www\./, "");
  const base = host.split(".")[0];
  return titleCase(base);
}
