/**
 * Owns, the ask-palette's keyboard shortcut as a reader's own platform writes
 * it.
 * Does not own: the key handling itself, which is CommandPalette's — it accepts
 * Meta OR Ctrl on every platform, so this is a label question, not a behaviour
 * one.
 *
 * WHY IT IS ITS OWN MODULE. It lived as a module-local `const` inside
 * Navbar.jsx, which was correct for the navbar and invisible to everything
 * else — so `RetrievalRank` wrote the glyph by hand and printed `⌘K` to a
 * Windows reader while the navbar, six inches away on the same screen,
 * correctly printed `Ctrl K`. One of the two was always going to be wrong for
 * somebody. Two places needing the same fact is the point at which the fact
 * stops living inside one of them.
 *
 * Read once at module scope, not per render: the platform cannot change
 * between renders, and `navigator.userAgentData` is the modern spelling with
 * `navigator.platform` as the deprecated fallback.
 */
const isMac = /Mac|iPhone|iPad/.test(
  navigator.userAgentData?.platform || navigator.platform || ""
);

export const SHORTCUT = isMac ? "⌘K" : "Ctrl K";
