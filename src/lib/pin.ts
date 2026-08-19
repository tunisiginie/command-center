/**
 * Shared between the edge middleware and the PIN page's server action.
 * Kept in its own module so neither one has to import the other — the
 * middleware runs on the Edge runtime and pulling it into a page bundle
 * causes trouble.
 */
export const PIN_COOKIE = "cc_unlocked";
