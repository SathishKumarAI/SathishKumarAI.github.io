import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { styles } from "../styles";
import { navLinks, SITE_REPO } from "../constants";
import ThemeToggle from "./ThemeToggle";
import FontSizeToggle from "./FontSizeToggle";
import { ICON_PATHS, readable, socialLinks } from "./icons";
import { SHORTCUT } from "../utils/shortcut";
import useActiveSection from "../hooks/useActiveSection";

/**
 * Owns, the fixed top bar: the section links, the theme and text-size
 * controls, the ask-box affordance, and the whole mobile menu.
 * Does not own: which section is currently active — `useActiveSection` owns
 * that, and `SideRail` reads the same hook so the two can never disagree. An
 * earlier version ran its own observer and they drifted.
 *
 * Two behaviours here are less obvious than they look:
 *
 * HIDE ON THE WAY DOWN, RETURN ON THE WAY UP. The bar is 77px of a fixed
 * viewport — about 9% of a phone screen, held open for the whole of a very
 * long page. It retracts while a reader is moving forward and comes back the
 * moment they reverse. The guards below exist because the naive version
 * flickers: a jump-to-section scroll is not a reading gesture, and the bar
 * must not hide itself while the menu is open.
 *
 * THE SHORTCUT LABEL IS PLATFORM-AWARE. The palette accepts Meta or Ctrl, but
 * the button used to print "⌘K" everywhere, showing Windows and Linux readers
 * a key they do not have.
 */
const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;


const Navbar = () => {
  const active = useActiveSection();
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const navRef = useRef(null);

  // Hide on the way down, return on the way up. The bar is 77px of a fixed
  // viewport: about 9% of a phone screen, held open the whole time someone is
  // reading a very long page. Five guards, because a naive version of this is
  // worse than not doing it:
  //   1. a movement threshold, so a 2px jitter cannot toggle it
  //   2. never hidden near the top, where there is nothing to reclaim
  //   3. never hidden while the mobile menu is open, that IS the nav
  //   4. never hidden while focus is inside it, which would strand a keyboard
  //      user on a control they cannot see
  //   5. never hidden during a jump the reader asked for, which is a scroll
  //      they did not make with their thumb
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    // Hiding on the way down is wanted on a phone too: 77px is 9% of the
    // screen and the reader is there to read. The earlier complaint was not
    // that it hid, it was that it did not come back, so the thresholds are
    // asymmetric rather than symmetric.
    //
    // The old rule was one `Math.abs(delta) > 6` gate for both directions,
    // which meant a small upward flick did nothing and the bar stayed gone:
    // measured, about 120px of deliberate upward scroll plus the 300ms
    // transition before it returned. The fix for that overshot: a single 2px
    // upward gate brought the bar back on any twitch, so a reader who nudges
    // the page while reading gets a 77px bar sliding in and out at the top of
    // their eyeline. That flicker is worse than either extreme.
    //
    // So the return is hysteretic rather than instant: upward movement has to
    // ACCUMULATE past SHOW_AFTER before the bar comes back, and any downward
    // movement zeroes that total. One mouse-wheel notch is about 100px in
    // Chrome, so 200px is a deliberate two-notch reach or a thumb swipe, and
    // jitter of a few px in both directions never sums to it.
    //
    // iOS and Android both fire momentum scroll events after the finger lifts,
    // and iOS additionally rubber-bands past the top and bottom. A negative
    // scrollY during a rubber-band would read as "scrolling up" forever, so the
    // position is clamped before the delta is taken.
    const HIDE_AFTER = 12;
    const SHOW_AFTER = 200;
    // Upward pixels banked since the last downward movement.
    let up = 0;

    // Guard 5: a jump is not a reading gesture. Tapping Experience in the menu
    // smooth-scrolls about 3,000px downward, which arrives as hundreds of
    // positive deltas, so the bar hid itself on the way and the reader landed
    // on the section with no hamburger and no way back into the menu short of
    // scrolling to the top. Measured before this: every menu link left the bar
    // at translateY(-100%), and the jump to Contact takes 1.5s of scrolling to
    // do it, so a fixed timeout long enough for that would be a long time to
    // freeze the bar for the short jumps too.
    //
    // So the jump owns the scroll until it stops owning it, and what ends it is
    // the reader taking hold of the page. The timeout is only a backstop for a
    // jump to the section you are already on, which scrolls nothing.
    let jumping = false;
    let settle = 0;
    const endJump = () => {
      jumping = false;
      clearTimeout(settle);
    };
    const startJump = () => {
      jumping = true;
      setHidden(false);
      clearTimeout(settle);
      settle = setTimeout(endJump, 2500);
    };

    const read = () => {
      raf = 0;
      // Clamped: iOS rubber-banding reports negative scrollY past the top and
      // an over-scrolled value past the bottom, and both produce deltas that
      // are not gestures.
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.min(Math.max(window.scrollY, 0), max);
      const delta = y - last;
      setScrolled(y > 24);

      const focusInside = navRef.current?.contains(document.activeElement);
      if (jumping || focusInside || y <= 160) {
        // Near the top there is nothing to reclaim, a focused control inside
        // the bar must never be scrolled out from under a keyboard user, and a
        // jump the reader asked for must not cost them the bar they asked from.
        setHidden(false);
        up = 0;
        last = y;
        return;
      }
      if (delta > 0) {
        // Any downward movement spends the bank, so a slow read punctuated by
        // small upward nudges never adds up to a return.
        up = 0;
        if (delta > HIDE_AFTER) {
          setHidden(true);
          last = y;
        }
      } else if (delta < 0) {
        up -= delta;
        last = y;
        if (up >= SHOW_AFTER) {
          setHidden(false);
          up = 0;
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Every in-page anchor on the site changes the hash, which covers the menu,
    // the desktop links, the Hero CTA and Availability. The two that scroll
    // without one, CommandPalette and SideRail, say so with `section-jump`.
    window.addEventListener("hashchange", startJump);
    window.addEventListener("section-jump", startJump);
    window.addEventListener("touchstart", endJump, { passive: true });
    window.addEventListener("wheel", endJump, { passive: true });
    window.addEventListener("keydown", endJump);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", startJump);
      window.removeEventListener("section-jump", startJump);
      window.removeEventListener("touchstart", endJump);
      window.removeEventListener("wheel", endJump);
      window.removeEventListener("keydown", endJump);
      clearTimeout(settle);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Guard 3: an open menu always shows its own bar.
  useEffect(() => {
    if (toggle) setHidden(false);
  }, [toggle]);

  // The menu is a modal dialog, so it behaves like one: Escape closes it, the
  // page behind it does not scroll, and focus returns to the control that
  // opened it rather than to the top of the document.
  useEffect(() => {
    if (!toggle) return;
    const opener = document.activeElement;
    const onKey = (e) => e.key === "Escape" && setToggle(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [toggle]);

  return (
    <nav
      ref={navRef}
      // Focus anywhere inside brings it straight back, so tabbing never lands on
      // a control that is off-screen.
      onFocusCapture={() => setHidden(false)}
      className={`${styles.paddingX} w-full flex items-center py-4 fixed top-0 z-40 transition-[transform,background-color,border-color] duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${scrolled ? "glass border-b border-line/60" : "bg-transparent"}`}
    >
      <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
        <a
          href="#"
          className="flex items-center gap-3 min-h-11"
          onClick={(e) => {
            // Without preventDefault the browser also navigates to "#", which
            // pushes a history entry and can jump-cut the smooth scroll.
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" });
          }}
        >
          {/* The monogram is gone, deliberately.
              On a personal portfolio the NAME is the logo; an "S" square gave
              one person a second identity mark standing immediately beside the
              first, which is a corporate convention borrowed where it has
              nothing to do. It also cost 44px in a bar that is already tight:
              measured, brand plus links need 851px against an 819px container
              at this bar's own 900px breakpoint. */}
          <p className="text-white-100 font-sans text-[17px] font-semibold tracking-[-0.02em] flex items-center">
            Sathish
            <span className="bar:inline hidden font-normal text-faint">&nbsp;· AI Engineer</span>
          </p>
        </a>

        <div className="hidden bar:flex items-center gap-8">
          <ul className="list-none flex flex-row gap-9">
            {navLinks.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  className={`relative ${styles.uiNav} transition-colors ${
                    active === n.id ? "text-accent-ink" : "text-secondary hover:text-white-100"
                  }`}
                >
                  {n.title}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px bg-accent transition-all duration-300 ${
                      active === n.id ? "w-full" : "w-0"
                    }`}
                  />
                </a>
              </li>
            ))}
          </ul>
          <button
            onClick={() => window.dispatchEvent(new Event("open-command"))}
            className="group font-mono text-label text-faint border border-line-strong rounded-lg px-2.5 py-1 hover:border-accent hover:text-accent transition-colors"
            aria-label={`${SHORTCUT}: ask about the work, or run a command`}
          >
            {/* It says "Ask" because that is the part nobody would guess. A bare
                shortcut chip reads as a command palette, and a reader who never
                opens it never learns the page can answer a question. */}
            {/* The shortcut lights with the word. Without `group-hover` the
                span keeps its own `text-faint` and half the chip changes
                colour on hover, which reads as a rendering fault rather than a
                hierarchy. */}
            Ask <span className="text-faint group-hover:text-accent/70 transition-colors">{SHORTCUT}</span>
          </button>
          <FontSizeToggle />
          <ThemeToggle />
        </div>

        <div className="bar:hidden flex flex-1 justify-end items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setToggle(!toggle)}
            className="relative z-50 text-white-100 text-[22px] leading-none w-11 h-11 grid place-items-center"
            aria-label={toggle ? "Close menu" : "Open menu"}
            aria-expanded={toggle}
            aria-controls="mobile-menu"
          >
            {toggle ? "✕" : "☰"}
          </button>
        </div>

        {createPortal(
          <AnimatePresence>
            {toggle && (
              <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              // `justify-start` with auto margins, not `justify-center`. The
              // menu is 961px of content in an 844px box on a 390x844 phone,
              // and a centred flex container splits negative free space evenly:
              // measured, the first link sat at top -21 with scrollTop already
              // at its minimum of 0, so About was cut off and no amount of
              // scrolling could reach it. Auto margins centre the same way when
              // there is room and collapse to 0 when there is not, which is the
              // whole difference.
              className="fixed inset-0 z-50 bar:hidden bg-primary flex flex-col justify-start px-8 py-24 overflow-y-auto"
            >
              {/* Fixed, not absolute. Absolute inside a scroll container scrolls
                  with the content: at the bottom of the menu this button sat at
                  top -97, and the hamburger that opened it is underneath the
                  overlay, so a phone had nothing left to close the menu with.

                  `backdrop-blur-md` had to go for that to work: a backdrop
                  filter makes its element the containing block for fixed
                  descendants, so the button kept scrolling. It was blurring
                  nothing anyway, `bg-primary` is rgb(15 34 40) with no alpha,
                  and index.css already says what a full-screen backdrop filter
                  costs a phone. */}
              <button
                onClick={() => setToggle(false)}
                aria-label="Close menu"
                className="fixed top-5 right-5 w-11 h-11 grid place-items-center rounded-xl border border-line-strong text-white-100 hover:border-accent hover:text-accent transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>

              <ul className="mt-auto list-none flex flex-col gap-6">
                {navLinks.map((n, idx) => (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + idx * 0.06 }}
                  >
                    <a
                      href={`#${n.id}`}
                      className={`font-display font-semibold tracking-[-0.02em] text-[clamp(1.75rem,9vw,2.35rem)] leading-none flex items-center min-h-11 ${
                        active === n.id ? "text-accent-ink" : "text-white-100"
                      }`}
                      onClick={() => {
                        setToggle(false);
                      }}
                    >
                      {n.title}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-10 pt-8 border-t border-line">
                <p className="font-sans text-[12px] font-medium uppercase tracking-[0.09em] text-secondary">
                  Reach me
                </p>
                <ul className="mt-4 flex flex-col gap-1 list-none">
                  {socialLinks().map((l) => (
                    <li key={l.k}>
                      <a
                        href={l.href}
                        // Every one of these leaves the site, so every one opens
                        // in a new tab: a recruiter who taps GitHub should still
                        // have the CV behind them when they come back.
                        target={l.k === "email" ? undefined : "_blank"}
                        rel="noreferrer"
                        onClick={() => setToggle(false)}
                        className="group flex items-center gap-3 min-h-11 text-secondary hover:text-accent-ink transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
                          <path d={ICON_PATHS[l.k]} />
                        </svg>
                        <span className="min-w-0">
                          <span className="block font-sans text-[12px] font-medium uppercase tracking-[0.09em] text-faint group-hover:text-accent-ink transition-colors">
                            {l.label}
                          </span>
                          {/* The destination in full. A label alone asks the
                              reader to trust where the tap goes. Same
                              `readable` as the contact card, so the two never
                              print the same address two ways. */}
                          <span className="block font-mono text-chip text-white-100 break-all">
                            {readable(l.href)}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* The collaboration note lives here on a phone, not in the page
                  flow. A reader on a phone is there for who he is, what he has
                  built and where he has worked; an invitation to send patches
                  is something you go looking for, so it sits where you look. */}
              <div className="mt-8 pt-6 border-t border-line">
                <p className="font-sans text-[12px] font-medium uppercase tracking-[0.09em] text-secondary">
                  Open to collaborators
                </p>
                <p className="mt-2 font-sans text-secondary text-body leading-[1.6]">
                  Issues and pull requests welcome on any repo linked here,
                  written with an LLM or not. Say why in the PR and that is
                  enough.
                </p>
                <div className="flex flex-wrap items-center gap-x-5">
                  <a
                    href={SITE_REPO}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setToggle(false)}
                    className="mt-2 inline-flex items-center min-h-11 font-mono text-data text-accent-ink hover:underline"
                  >
                    CONTRIBUTING.md ↗
                  </a>
                  {/* The crawler notice is desktop-only on the page now, so the
                      one thing a curious human might want from it lives here. */}
                  <a
                    href="/llms.txt"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setToggle(false)}
                    className="mt-2 inline-flex items-center min-h-11 font-mono text-data text-secondary hover:text-accent-ink transition-colors"
                  >
                    /llms.txt ↗
                  </a>
                </div>
              </div>

              <div className="mt-6 mb-auto flex items-center gap-3">
                <FontSizeToggle />
                <button
                  onClick={() => {
                    setToggle(false);
                    window.dispatchEvent(new Event("open-command"));
                  }}
                  className="font-mono text-nav text-secondary border border-line-strong rounded px-3 min-h-11 flex items-center"
                >
                  {SHORTCUT} · ask or act
                </button>
              </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </nav>
  );
};

export default Navbar;
