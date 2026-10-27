import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Owns, the RIGHT-edge button back to the top of the page.
 * Does not own: moving one section further down, which is its mirror on the
 * left edge, `ScrollDown.jsx`. The two share a threshold, a size, an inset and
 * a stroke vocabulary on purpose: changing one means changing the other, or
 * they stop reading as one affordance.
 */
const BackToTop = () => {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const on = () => setPast(window.scrollY > window.innerHeight);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // It used to hide itself once the footer appeared, to avoid painting a scrim
  // over the colophon. That removed the control from exactly the place a reader
  // who has reached the end looks for it. The footer reserves space for it
  // instead, at every width.
  const show = past;

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={() =>
            window.scrollTo({
              top: 0,
              // An explicit behavior beats the CSS reduced-motion reset, and
              // this is a multi-thousand-pixel scroll.
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
            })
          }
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full glass text-white-100 hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
        >
          {/* Drawn, not a `↑` character. The glyph inherited the mono font's
              metrics and optical weight, so it never quite matched the down
              arrow on the opposite edge — and the pair only reads as one
              affordance if both marks are the same mark. Same stroke
              vocabulary as the copy control in Contact.jsx. `font-mono` went
              with the character that needed it. */}
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
            <path d="M12 19V5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;
