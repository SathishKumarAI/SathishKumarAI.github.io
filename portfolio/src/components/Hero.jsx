import { motion, useReducedMotion } from "framer-motion";
import { styles } from "../styles";
import LiveClock from "./LiveClock";
import CodeCompletion from "./CodeCompletion";
import { AvailabilityCompact } from "./Availability";
import TokenText, { CLAIM_GAP } from "./TokenText";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};
/**
 * The three claims, and when each starts streaming.
 *
 * 620ms holds them until the headline above has landed — the hero's cascade
 * puts the h1 at roughly 0.3s and it takes 0.6s to settle. Starting the words
 * under a still-moving headline asks the eye to watch two things at once.
 *
 * The pace itself lives in TokenText, shared with About: one effect, one
 * speed, wherever it appears.
 */
const CLAIMS = [
  "Retrieval that cites its source",
  "Vision that trains where the data already lives",
  "Results reported as measured, negative ones included",
];
const CLAIM_START = 620;

/**
 * The rule under the status row DRAWS ITSELF, left to right, as the row
 * arrives. Borrowed deliberately from `Availability`, which already does this
 * and already says why: "a line being drawn reads as something being written
 * down". It is the one piece of motion in the hero that is not a fade, which
 * is exactly why it is spent on the row that was otherwise a label floating in
 * dead space.
 */
const rule = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.55, ease: [0.2, 0.65, 0.3, 0.9] } },
};

const rise = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.2, 0.65, 0.3, 0.9] } },
};

const Hero = () => {
  const reduced = useReducedMotion();
  // Top-aligned, not centred. Centring a 549px composition in a 900px viewport
  // left 140px of dead space between the navbar and the name, and the matching
  // 136px at the bottom was not dead: the scroll cue lives there. So the slack
  // was only ever visible at the top. An explicit top padding puts the gap
  // where it was chosen rather than where the arithmetic landed.
  return (
    /* `styles.paddingX` is on the STAGE, not on the measure — the same split
       `SectionWrapper` and `Navbar` use. It used to sit on the `max-w-7xl` div
       below, which put the gutter INSIDE the 1280px cap, so the hero indented
       itself by a further 72px the moment the viewport passed 1280px and
       nothing else on the page did. Measured at 1920px: the h1 started at
       392px while every section <h2> started at 320px; at 2545px both numbers
       held the same 72px gap. Below 1280px the two were identical, which is
       why a 1280-wide laptop never showed it. */
    <section
      className={`${styles.paddingX} relative w-full min-h-screen min-h-[100svh] flex items-start pt-20 sm:pt-24`}
      aria-label="Intro"
    >
      {/* Something behind the headline. See `.bloom` in index.css: the page had
          nothing between the type and a flat ground, which is most of why it
          read as older than it is. */}
      <span aria-hidden="true" className="bloom" />

      <motion.div
        variants={container}
        initial={reduced ? false : "hidden"}
        animate="show"
        className="relative z-10 max-w-7xl mx-auto w-full"
      >
        {/* STATUS, not a byline.
            This row said "SATHISH KUMAR" twenty pixels under a navbar that
            already says whose page this is, and says it at every scroll
            position. The hero's first line is better spent on the one fact a
            recruiter is actually looking for, and availability IS status —
            so it sits with the clocks rather than below the CTA, where it had
            been the last thing after the call to action.
            The full name still appears in the page title, the footer
            colophon, and the AgentNote block written for crawlers. */}
        {/* Tighter than it was. Measured at 1707x872 the navbar ended at 76px
            and this row began at 128 — a 39px row floating in a 147px band,
            which reads as dead space rather than as breathing room. The top
            padding comes down 32px and the margin below it 16px; the hero is
            `items-start` inside `min-h-screen`, so the slack moves to the
            bottom where the scroll cue already lives. */}
        <motion.div
          variants={rise}
          className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-4 mb-8 sm:mb-10"
        >
          {/* A LINK, not a label. "Open to AI engineering roles" is the one
              fact on this page a recruiter acts on, and it was a dead <span>:
              the obvious next move after reading it had nowhere to go. */}
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 rounded-lg -mx-1 px-1 transition-colors hover:text-live focus-visible:text-live"
          >
            <AvailabilityCompact />
            {/* Slides out on hover rather than sitting there: an arrow that is
                always visible is a second CTA competing with the real one. */}
            <span
              aria-hidden="true"
              className="font-sans text-[13px] text-live opacity-0 -translate-x-1 transition duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
            >
              Get in touch →
            </span>
          </a>
          <LiveClock className="text-label hidden sm:inline" />
          {/* `border-b` replaced by a drawn rule: a border cannot animate its
              own length, and `scaleX` on a 1px span is a compositor-only
              transform. `origin-left` is what makes it draw rather than grow
              from the middle. */}
          <motion.span
            aria-hidden="true"
            variants={rule}
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-line"
          />
        </motion.div>

        <motion.h1
          variants={rise}
          className={`${styles.heroHeadText} max-w-[18ch]`}
        >
          From model development{" "}
          {/* No `whitespace-nowrap` here. It kept the second sentence on one
              line, which held at 100% and overflowed the viewport by 11px once
              the reader's text-size control reached 140%: the span measured
              1314px against a 1440px window and was the only thing on the page
              that overflowed. `max-w-[18ch]` on the h1 already governs where
              this breaks. */}
          <span>
            to{" "}
            <span className="text-accent-ink">
              {/* `real-world` is held together: a line break at the hyphen left
                  "real-" hanging at the end of a line, which reads as a broken
                  word rather than a compound one. One 10-character token, so it
                  cannot be what overflows — measured at 390px and 140%. */}
              <span className="whitespace-nowrap">real-world</span> impact
            </span>
            .
          </span>
        </motion.h1>

        {/* The lede was one 38-word paragraph. It is now the same three claims
            as three lines, each on its own rule.

            Nothing was added and nothing new is asserted: "retrieval that cites
            the passage it used" became "Retrieval that cites its source", and
            the negative-results clause — the most distinctive sentence on the
            page — is kept whole as its own line rather than trailing a
            paragraph.

            Why lines and not simply a shorter paragraph: a spec list is what
            makes a page read as a campaign. Three claims stacked against rules
            scan in about a second each; the same words in prose ask for a
            decision to start reading, which most people who land here do not
            make. */}
        {/* The claims STREAM in, word by word, rather than fading as a block.
            On a page about models, text arriving the way a model emits it is
            the one piece of motion that carries meaning; a fourth fade would
            have carried none. See TokenText for why it is a texture and not a
            delay — all three complete inside ~1.2s, so nothing is withheld.

            `CLAIM_START` holds the words until the headline above has landed,
            so the eye is handed down the page rather than asked to watch two
            things at once. The per-claim offset is the line's own place in
            the queue. */}
        <ul className="mt-8 max-w-xl list-none space-y-3">
          {CLAIMS.map((claim, i) => (
            <li
              key={claim}
              className="flex items-baseline gap-3 font-sans text-secondary text-[calc(clamp(0.95rem,1.35vw,1.15rem)*var(--type-scale,1))] leading-[1.45]"
            >
              <span
                aria-hidden="true"
                className="tok relative top-[-0.3em] h-px w-5 shrink-0 bg-accent/70"
                style={{ "--tok": 0, "--tok-start": `${CLAIM_START + i * CLAIM_GAP}ms` }}
              />
              <TokenText text={claim} start={CLAIM_START + i * CLAIM_GAP + 60} />
            </li>
          ))}
        </ul>

        {/* One CTA, not two. "Get in touch" was the fifth route to #contact, navbar, right rail, palette, and "Reach out →" in the status card a
            screen below, which carries context a bare button cannot. A secondary
            button beside a primary splits the click rather than adding a path. */}
        <motion.div variants={rise} className="mt-10 flex flex-wrap items-center gap-4">
          {/* Lands on Experience, not Projects. It pointed at #work, which
              jumped the reader over the entire career history to the project
              grid: the one CTA on the page skipped the section a recruiter
              opens a portfolio to read. From here the page reads in its
              intended order, experience, then stack, then the projects those
              two produced. */}
          <a
            href="#roles"
            className="btn-primary inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 font-sans font-semibold text-[15px] tracking-[-0.01em]"
          >
            Start with the roles
          </a>

        </motion.div>

      </motion.div>

      {/* The lower slack, below `rail`. The hero is `min-h-screen` and
          top-aligned, so its content ends at 591 of 844 on a phone and the rest
          was empty: the scroll cue that earns that space on a desktop is
          `hidden sm:flex`. Absolute, so it fills what was already there and
          adds no height. */}
      <CodeCompletion />

      {/* VERTICAL, and lifted clear of the field's labels.
          Measured at 1707x872 it overlapped the OUTPUT caption by 53 x 33px:
          the cue sat at bottom-8 (32px) and the layer labels sit at bottom
          22px and stand 43px tall, so the two were competing for the same
          corner. `bottom-28` puts it above that block entirely.

          The word now reads top-to-bottom along the edge rather than sitting
          horizontally above the line. `writing-mode` rather than a rotate:
          it keeps the glyphs upright-by-line and leaves the element's own box
          the right shape, so nothing has to be re-positioned to compensate. */}
      <a
        href="#about"
        className="absolute bottom-28 right-6 sm:right-10 z-10 hidden sm:flex flex-col items-center gap-3 group"
        aria-label="Scroll to about"
      >
        <span className="[writing-mode:vertical-rl] font-mono text-micro tracking-label uppercase text-faint group-hover:text-accent transition-colors">
          scroll
        </span>
        <span className="relative block w-px h-10 bg-line overflow-hidden">
          <motion.span
            className="absolute inset-x-0 top-0 h-4 bg-accent"
            animate={reduced ? {} : { y: [-16, 40] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeIn" }}
          />
        </span>
      </a>
    </section>
  );
};

export default Hero;
