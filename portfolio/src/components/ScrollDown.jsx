import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { navLinks } from "../constants";

/**
 * Owns, the LEFT-edge button that moves the reader one section further down.
 * Does not own: going back to the top, which is `BackToTop.jsx` on the right
 * edge, and whose shape, timing and appearance threshold this deliberately
 * mirrors.
 *
 * WHY IT IS A MIRROR AND NOT A SECOND IDEA. The two buttons are one
 * affordance seen from both ends: the same 44px glass pill, the same 6px
 * inset, the same `scrollY > innerHeight` threshold, so they appear in the
 * same gesture and read as a pair rather than as two unrelated controls that
 * happen to be round. The only differences are the edge they sit on, the
 * direction they point, and what they do.
 *
 * WHY NEXT SECTION AND NOT THE BOTTOM OF THE PAGE. The literal mirror of
 * "back to top" is "jump to the end", and the end of this page is the
 * colophon — build tools and typefaces. Sending a reader there in one click
 * would land them on the weakest thing on the site. Stepping one section at a
 * time is the same gesture and arrives somewhere worth being.
 *
 * WHY IT DISAPPEARS AT THE LAST SECTION. There is no next section from
 * Contact, and a control that stays visible with nothing to do is a control
 * that lies about what it can do. Past the last anchor, only `BackToTop`
 * remains — which is also why the footer needs no left-side clearance to match
 * its `sm:pr-24`: by the time the footer is on screen, this button is gone.
 */

/**
 * The next section is the first nav anchor still below the viewport's top
 * edge.
 *
 * It resolves the `.hash-span` anchor rather than the `<section>`, because the
 * anchor carries `scroll-margin-top: 5.5rem` to clear the fixed nav — so
 * scrolling to it lands exactly where a nav click lands, instead of parking
 * the heading underneath the bar.
 *
 * THE THRESHOLD IS READ, NOT CHOSEN, and getting this wrong broke the button
 * outright. `scroll-margin-top` means that after a jump the anchor comes to
 * rest exactly that far below the viewport's top edge - 88px, from
 * `.hash-span`'s `5.5rem`. A hand-picked 32px slack therefore left the section
 * you had just arrived at still sitting "below the fold" by its own test, so
 * it stayed the next section forever: one click moved you to Roles and every
 * click after that did nothing. Measured in Chrome at 1707x838 - the anchor
 * parked at 88px and the label never advanced past "Roles".
 *
 * So the line is taken from the anchor's own computed `scroll-margin-top`
 * rather than written down here. Change `.hash-span` in index.css and this
 * follows; hard-code it and the two drift apart silently. The 8px is for
 * subpixel rounding at fractional zoom, nothing more.
 */
const nextSection = () => {
  for (const n of navLinks) {
    const el = document.getElementById(n.id);
    if (!el) continue;
    const parked = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    if (el.getBoundingClientRect().top > parked + 8) return n;
  }
  return null;
};

const ScrollDown = () => {
  const [past, setPast] = useState(false);
  const [next, setNext] = useState(null);

  useEffect(() => {
    const on = () => {
      setPast(window.scrollY > window.innerHeight);
      setNext(nextSection());
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    // Resize changes which anchor is below the fold, and a phone rotating is
    // a resize. Without this the button can point at the wrong section after
    // an orientation change.
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  const go = () => {
    if (!next) return;
    const el = document.getElementById(next.id);
    if (!el) return;
    // Tells Navbar this is a jump, not a reading gesture, so the bar does not
    // hide itself mid-scroll. SideRail and CommandPalette do the same.
    window.dispatchEvent(new Event("section-jump"));
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    <AnimatePresence>
      {past && next && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={go}
          // Names the destination, not the direction: an arrow already says
          // "down", so the label is only worth its space if it says where.
          aria-label={`Next section: ${next.title}`}
          className="fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full glass text-white-100 hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
        >
          {/* Drawn, not a `↓` character: a text arrow inherits the font's
              metrics and optical weight, which is why the two buttons never
              quite matched. Same stroke vocabulary as the copy control in
              Contact.jsx. */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <polyline points="5 12 12 19 19 12" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollDown;
