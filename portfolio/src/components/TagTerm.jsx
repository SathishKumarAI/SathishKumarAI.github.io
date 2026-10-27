/* ---------------------------------------------------------------------------
   PLAIN ENGLISH.

   One tool chip — "PySpark", "Docker", "RAG" — wherever it appears on the page.

   It does three jobs: shows the tool's logo if one exists, explains the term in
   plain English when you hover or tap it, and stays a 44px touch target on a
   phone while looking like ordinary text.

   The logos are the interesting part. All 38 marks together are ~25 kB
   gzipped (measured 2026-10-27: `gzip -c dist/assets/glyphs-*.js | wc -c` ->
   25,835 bytes; `ICON_COUNT` in toolIcons.js is the authority on the count, and
   the generator writes it). That is a lot to pay at first paint for decoration,
   so they live in a separate file fetched the first time any chip mounts. One
   module-level cache and a set of waiting callbacks means every chip on screen
   shares a single download rather than triggering one each.

   Walked through slowly: docs/LEARNING-NOTES.md, sections 2 and 5.
--------------------------------------------------------------------------- */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { glossary } from "../constants";

/**
 * Owns: one technology chip, and the plain-English definition behind it.
 *
 * Two chips, two jobs:
 *  - In Stack the chip TEACHES, so the definition opens on hover as well as on
 *    click. A reader scanning tools should not have to guess that a chip is
 *    clickable to find out what it means.
 *  - On project and experience cards (`plain`) the chip STATES. There the
 *    expanded name is a native tooltip, so a definition panel never opens inside
 *    a tilting card or competes with the card's own links.
 *
 * Whether a definition exists is signalled by a dotted underline on the word,
 * the long-standing convention: not a dashed box and a "?" on every chip. The
 * underline goes solid on hover and focus, so the affordance confirms itself
 * before the reader commits to a click.
 *
 * Two tiers, set by `primary`. A group's headline tools get a filled chip,
 * everything else stays outline. The fill inverts per theme rather than being
 * dark in both: a dark fill on the dark ground would read as less emphasis, not
 * more. On hover a filled chip goes to an accent fill with --c-strong ink,
 * which is the one accent pairing that clears AA (4.68:1); accent-ink text on
 * the fill would not.
 */
/**
 * The marks arrive in their own chunk, fetched once on first mount.
 *
 * 25 brand paths are 32kB of path data — +17kB gzipped on an entry bundle of
 * 33kB, which is a 50% tax on first paint for decoration. Loaded this way the
 * entry bundle does not move at all and the glyphs appear a frame or two after
 * the chips they sit in, below the fold, where nobody is looking yet.
 *
 * One module-level cache and one subscriber set, not a context: every chip on
 * the page wants the same object, and a provider around them would re-render
 * all 33 of them to deliver it.
 */
let ICONS = null;
let started = false;
const waiting = new Set();

const loadIcons = () => {
  if (started) return;
  started = true;
  import("./glyphs")
    .then((m) => {
      ICONS = { ...m.CONCEPT_ICONS, ...m.TOOL_ICONS };
      waiting.forEach((fn) => fn());
      waiting.clear();
    })
    // A failed chunk means no glyphs, which is exactly how a term with no mark
    // already renders. Nothing else on the page depends on it.
    .catch(() => {});
};

const useToolIcons = () => {
  const [, bump] = useState(0);
  useEffect(() => {
    if (ICONS) return undefined;
    const fn = () => bump((n) => n + 1);
    waiting.add(fn);
    loadIcons();
    return () => waiting.delete(fn);
  }, []);
  return ICONS;
};

/**
 * The tool's own mark, when one exists.
 *
 * `aria-hidden`, always: the name is right beside it in text, so announcing the
 * logo as well would read the same thing twice. It is scaled in `em` so it
 * tracks the chip's font size, including the reader's own text-size control,
 * and painted in `currentColor` rather than the brand hex — thirty coloured
 * logos in one section is the badge wall this section's first sentence argues
 * against ("Not a badge collection"). At 0.85 opacity the glyph sits under the
 * word rather than competing with it.
 *
 * A term with no mark renders nothing here. Concepts (RAG, MLOps, Evaluation)
 * have no logo, and two of the products named — Azure, DynamoDB, S3, Pinecone —
 * are simply absent from simple-icons. A stand-in glyph would be decoration
 * pretending to be information.
 */
const ToolGlyph = ({ name }) => {
  const icons = useToolIcons();
  const icon = icons?.[name];
  if (!icon) return null;
  // Brand marks are filled silhouettes and carry `p`; the hand-drawn category
  // marks are strokes and carry `d` with `s: 1`. One renderer, two shapes of
  // data, because a chip does not care which kind of thing its term is.
  const stroke = icon.s === 1;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      /* `inline-block` with a baseline nudge, NOT a flex child. The chip is
         `inline-flex` on a phone and plain `inline` from 640px up, so a `gap`
         works at one size and silently does nothing at the other — which
         dropped every glyph onto its own line above the word. A margin and a
         baseline offset behave the same in both. */
      className="inline-block align-[-0.16em] mr-1.5 h-[1.05em] w-[1.05em] opacity-90"
      fill={stroke ? "none" : "currentColor"}
      stroke={stroke ? "currentColor" : undefined}
      strokeWidth={stroke ? 1.8 : undefined}
      strokeLinecap={stroke ? "round" : undefined}
      strokeLinejoin={stroke ? "round" : undefined}
    >
      <path d={stroke ? icon.d : icon.p} />
    </svg>
  );
};

const CHIP =
  "font-mono text-chip px-2 rounded border transition-colors " +
  // Touch first: 44x44 minimum on phones, back to the dense rhythm from sm up.
  "inline-flex items-center justify-center min-h-11 min-w-11 py-0 " +
  "sm:min-h-0 sm:min-w-0 sm:py-0.5 sm:inline";

/**
 * `flow`: the same term with the box taken off.
 *
 * Stack on a phone is every tool in the set, one after another. As boxes that
 * is as many bordered rectangles about 50px tall, which turns a list into most
 * of a screen per group and reads as a form rather than a vocabulary. Bare, the
 * words sit in a paragraph-like flow and the dotted underline does all the work
 * the border was doing — it already marks which terms are definable, which is
 * the only thing the box was communicating.
 *
 * The 44px touch target stays: it moves from the box to the line box.
 */
const FLOW = "font-mono text-chip inline-flex items-center min-h-11 transition-colors";

/**
 * The same bare treatment, without the 44px touch floor.
 *
 * `FLOW` carries `min-h-11` because on a phone every term is a tap target. The
 * Stack columns are desktop-only and pointer-driven, and six stacked 44px rows
 * is 264px of column for six words. This keeps the ink and drops the floor.
 */
const FLOW_DENSE = "font-mono text-chip inline-flex items-center transition-colors";

// Idle and active tone for each tier. Kept out of the component so the two
// tiers can be compared side by side instead of read out of nested ternaries.
const TONES = {
  solid: {
    idle: "border-chip-solid bg-chip-solid text-chip-solid-ink hover:border-accent hover:bg-accent hover:text-black-100",
    active: "border-accent bg-accent text-black-100",
  },
  outline: {
    idle: "border-line-strong text-secondary hover:border-accent hover:text-accent-ink",
    active: "border-accent text-accent-ink",
  },
};

// Without a box, the two tiers are carried by weight and colour instead of by
// fill: a headline tool reads as the page's own text, the rest as prose beside
// it. Same information, a fifth of the ink.
const FLOW_TONES = {
  solid: { idle: "text-white-100", active: "text-accent-ink" },
  outline: { idle: "text-secondary", active: "text-accent-ink" },
};

const TagTerm = ({
  name,
  plain = false,
  primary = false,
  flow = false,
  dense = false,
  // Shared-panel mode. See `show` below: supplying `onDefine` turns this chip
  // from something that owns a popover into something that reports to one.
  /* `label` lets the chip SHOW one string while being ABOUT another. The
     Stack diagram's compact cloud view needs exactly this: the mark and the
     definition belong to the role ("Object store"), and the text the reader
     needs is the service filling it ("Blob Storage"). Without it the compact
     view had to drop to bare text, which is what made it read as scattered —
     nothing marked where one item ended and the next began. */
  label = null,
  onDefine = null,
  onPin = null,
  active = false,
}) => {
  const entry = glossary[name];
  const g = plain ? null : entry;
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  // Where the panel sits, in wrapper-local px. Centred on the chip until that
  // would put it off the screen, see the layout effect below.
  const [left, setLeft] = useState(0);
  const ref = useRef(null);
  const tipRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setPinned(false);
    };
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // The panel used to be `left-1/2 -translate-x-1/2`: centred on its chip, with
  // nothing holding it inside the viewport. `w-[min(17rem,calc(100vw-2rem))]`
  // caps the width and says nothing about the position, so a chip near either
  // edge threw the panel off the screen. Measured at 390px: React's panel ran
  // from 163 to 435 and took the document's scrollWidth to 435 with it, so the
  // whole page scrolled sideways; PySpark's started at -63, where nothing can
  // reach it.
  //
  // So the panel is centred on the chip only while that fits, and slides along
  // the edge when it does not. A layout effect and not an effect, because this
  // runs between the panel existing and the browser painting it: an effect
  // would show it in the wrong place for one frame first.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const wrap = ref.current;
      const tip = tipRef.current;
      if (!wrap || !tip) return;
      const r = wrap.getBoundingClientRect();
      const w = tip.offsetWidth;
      // clientWidth, not innerWidth: innerWidth counts a desktop scrollbar as
      // usable space and would push the panel under it.
      const vw = document.documentElement.clientWidth;
      const PAD = 12;
      const centred = (r.width - w) / 2;
      const min = PAD - r.left;
      const max = vw - PAD - w - r.left;
      setLeft(Math.max(min, Math.min(centred, max)));
    };
    place();
    // Rotating a phone with a definition open changes every one of those
    // numbers.
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  // Plain chip: states a fact. The expanded name: "Retrieval-Augmented
  // Generation" behind "RAG": is still available, on hover, without opening
  // anything that could cover the card.
  if (!g) {
    const hint = entry?.full ?? entry?.def ?? undefined;
    return (
      <span className={`${CHIP} border-line text-secondary`} title={hint}>
        <ToolGlyph name={name} />
        {name}
      </span>
    );
  }

  const tone = flow
    ? (primary ? FLOW_TONES.solid : FLOW_TONES.outline)
    : (primary ? TONES.solid : TONES.outline);
  const shape = flow ? (dense ? FLOW_DENSE : FLOW) : CHIP;

  /**
   * `onDefine` switches this chip from OWNING a popover to REPORTING to one.
   *
   * The floating version is still here and still used anywhere a chip stands
   * on its own. In the Stack grid it was the wrong shape twice over: the panel
   * is `rgba(255 255 255 / 0.62)` -- a translucent surface carrying prose, so
   * whatever sat behind it bled through and the definition could not be read
   * -- and hover-open plus click-pin meant two could be on screen at once,
   * overlapping each other.
   *
   * With `onDefine` the chip says what it is and a single panel owned by the
   * section decides where that goes. Nothing floats, so nothing can cover a
   * neighbour, and "only one at a time" stops being a thing to coordinate
   * between that many independent components.
   */
  const entryOut = g && { name, full: g.full, def: g.def, link: g.link };

  const show = () => {
    clearTimeout(closeTimer.current);
    if (onDefine) { onDefine(entryOut); return; }
    setOpen(true);
  };
  const hide = () => {
    if (pinned) return;
    if (onDefine) { onDefine(null); return; }
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <span
      ref={ref}
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        onClick={() => {
          // Pinning belongs to the parent when a shared panel is in play:
          // "only one pinned" is a fact about the section, not about a chip.
          if (onDefine) { onPin?.(entryOut); return; }
          // A second tap closes. The old version only unpinned, which on a
          // touch screen left the panel open with nothing to dismiss it:
          // there is no mouseleave to fall back on.
          if (pinned) {
            setPinned(false);
            setOpen(false);
          } else {
            setPinned(true);
            setOpen(true);
          }
        }}
        onFocus={show}
        onBlur={hide}
        aria-expanded={onDefine ? Boolean(active) : open}
        aria-label={label ? `${label} — ${name}: what is this?` : `${name}: what is this?`}
        className={`${shape} group ${tone[(onDefine ? active : open) ? "active" : "idle"]}`}
      >
        {/* Outside the underlined span on purpose: the dotted rule marks the
            WORD as definable, and carrying it under the logo too would say the
            mark is part of the term. */}
        <ToolGlyph name={name} />
        <span
          className={`border-b border-current pb-px ${
            open ? "border-solid" : "border-dotted group-hover:border-solid group-focus-visible:border-solid"
          }`}
        >
          {label ?? name}
        </span>
      </button>

      {open && !onDefine && (
        <span
          ref={tipRef}
          role="tooltip"
          style={{ left }}
          className="absolute z-30 top-full mt-1.5 w-[min(17rem,calc(100vw-1.5rem))] rounded-xl glass p-3 font-sans text-data text-secondary leading-snug block text-left normal-case tracking-normal"
        >
          <b className="text-white-100">{name}</b>
          {g.full && g.full !== name && (
            <span className="block font-mono text-label text-faint mt-0.5">
              {g.full}
            </span>
          )}
          <span className="block mt-1.5">{g.def}</span>
          {g.link && (
            <a
              href={g.link}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                setOpen(false);
                setPinned(false);
              }}
              className="mt-2 block font-mono text-chip text-accent-ink hover:underline"
            >
              Learn more ↗
            </a>
          )}
        </span>
      )}
    </span>
  );
};

export default TagTerm;
