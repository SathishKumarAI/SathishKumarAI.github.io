import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { profile, projects } from "../constants";
import { fadeIn } from "../utils/motion";
import TokenText, { CLAIM_GAP } from "./TokenText";
import { SectionWrapper } from "../hoc";
import SectionHead from "./SectionHead";
import Availability from "./Availability";

/* Portrait slot. Holds its shape whether or not the image exists yet, so
   dropping a file in later changes nothing about the layout. */
const Portrait = () => (
  <div className="w-full aspect-[4/5] rounded-2xl border border-line bg-tertiary overflow-hidden">
    {profile.photo ? (
      <img
        src={profile.photo}
        alt={profile.alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-faint">
        <span className="font-display text-[34px] leading-none text-line">S</span>
        <span className="font-sans text-[12px] font-medium uppercase tracking-[0.09em]">
          portrait: to come
        </span>
      </div>
    )}
  </div>
);

/**
 * Owns, the introduction: who he is, in his words, and the fact that he is
 * looking.
 * Does not own: what he can do. That is `Tech.jsx`, and it used to be said
 * twice.
 *
 * There were six capability cards under this, `Data Engineering` through
 * `Software & Full-Stack`. They came out, and the deletion is the point:
 *
 *  - **They restated Stack.** Six cards partitioning his skills six ways, above
 *    six stack groups partitioning the same skills six ways. The reader met the
 *    same taxonomy twice, in different words, 2,000px apart.
 *  - **They were claims on a page that promises evidence.** The lede promises
 *    "results reported as measured, including the ones that came back
 *    negative" (it was the headline's own second sentence until 2026-09-14);
 *    the cards said "Turning raw data into decisions"
 *    and "built to generalize past the demo", which is true of every ML
 *    engineer who has ever written a portfolio. The actual evidence — shipped
 *    systems, with diagrams of how they work — was 3,000px further down.
 *  - **They cost ~700px** between the lede and Experience, which is the section
 *    a recruiter opens this page to read.
 *
 * Breadth is still on the page. It is in Stack, where it is specific, and in
 * Work, where it is demonstrated.
 */
/**
 * What the work does, and the project that proves each one.
 *
 * The claim is editorial; the PROOF is the project's own `outcome` string,
 * resolved by name at module load. Nothing here is typed twice: rename a
 * project in `constants` and the row disappears rather than printing a proof
 * that no longer exists, which is the house rule — absent beats invented.
 */
const PRINCIPLES = [
  { claim: "It runs where the data already is", name: "federated-yolov8-object-detection" },
  { claim: "It shows the source it used", name: "ai-due-diligence-copilot" },
  { claim: "You can try it in a minute, with no account", name: "pb-card-deck" },
]
  .map((p) => ({ ...p, project: projects.find((x) => x.name === p.name) }))
  .filter((p) => p.project);

/**
 * How long the scroll has to be still before the claims start streaming.
 *
 * `useInView` alone was not enough. It fires the moment the list is partly on
 * screen, which mid-scroll is while the section is still flying past — so the
 * whole cascade played during the travel and was over before the reader had
 * arrived. Reported as "I can't humanly measure it".
 *
 * 220ms of no scroll events is the difference between "this is passing through
 * the viewport" and "this person has stopped here".
 */
const SETTLE_MS = 220;

/**
 * How many of this section's elements animate themselves in: the headshot, the
 * intro paragraph, the claims list, and the status card. The stream waits for
 * all four. If a fifth is ever added it has to report in too, or the stream
 * starts one element early -- which is exactly the kind of silent drift a
 * magic delay would hide.
 */
const LANDING_PARTS = 4;

/**
 * The safety net, and it is not optional.
 *
 * A deep link to `#about` scrolls to the section's hash anchor, which sits
 * above this list -- so the claims can be on screen without clearing the
 * threshold the gate watches. Measured on `/#about`: the section's own content
 * landed at 604ms and 1171ms, and the gate never opened at all. The words were
 * therefore left at `opacity: 0` PERMANENTLY.
 *
 * That is not a missed animation, it is hidden content. Once any part of the
 * list has been on screen this long, the stream runs regardless of every other
 * condition. A reveal may be skipped; text may never be withheld.
 */
const FORCE_MS = 2500;

const About = () => {
  /**
   * Two conditions, not one: the claims must be properly on screen AND the
   * reader must have stopped moving.
   *
   * `useInView` is deliberately NOT `once` here. A reader who scrolls straight
   * past would otherwise burn the one play on a section they never stopped at;
   * leaving it live means the gate is still armed, and whenever they do come
   * to rest on it the cascade runs. `played` is what makes it fire once —
   * a reveal that replays every time it re-enters the viewport stops being a
   * reveal and becomes a loop.
   */
  const claimsRef = useRef(null);
  const visible = useInView(claimsRef, { amount: 0.2 });
  // Any sliver of the list, for the safety net below.
  const onScreen = useInView(claimsRef, { amount: 0.01 });
  const [settled, setSettled] = useState(false);

  /**
   * ALL of the section's own entrance must finish first.
   *
   * The claims were streaming while the headshot, the intro and the status
   * card were still fading in -- two animations competing for the same eye,
   * which is what made the stream impossible to follow even once it waited for
   * the scroll to stop.
   *
   * Counted rather than timed. No single element is reliably last: the status
   * card is `fadeIn(delay 0.2, duration 0.7)` and the claims list is
   * `fadeIn(0.15, 1.0)`, so which one finishes later depends on where the
   * stagger puts each of them. A fixed delay would be a guess that goes stale
   * the moment a variant is retuned; framer already knows when each one is
   * done, so each reports in and the stream starts when the last has.
   */
  const [forced, setForced] = useState(false);
  const [landed, setLanded] = useState(0);
  const noteLanded = () => setLanded((n) => n + 1);
  const contentLanded = landed >= LANDING_PARTS;
  const claimsSeen = forced || (settled && contentLanded);

  useEffect(() => {
    if (settled || !visible) return undefined;
    let id = 0;
    const arm = () => {
      clearTimeout(id);
      id = window.setTimeout(() => setSettled(true), SETTLE_MS);
    };
    arm();
    window.addEventListener("scroll", arm, { passive: true });
    return () => {
      clearTimeout(id);
      window.removeEventListener("scroll", arm);
    };
  }, [visible, settled]);

  // See FORCE_MS. Tied to the list being on screen rather than to mount, so a
  // reader still up in the hero does not have the reveal spent without them.
  useEffect(() => {
    if (claimsSeen || !onScreen) return undefined;
    const id = window.setTimeout(() => setForced(true), FORCE_MS);
    return () => clearTimeout(id);
  }, [onScreen, claimsSeen]);

  return (
  <>
    {/* No meta line, deliberately: the first section sets no pattern for the
        rest to repeat, and there is no honest number to put over an
        introduction. See SectionHead. */}
    <SectionHead title="About" />

    {/* Portrait in its own column; the bio and the status block share the
        second, so the status no longer drops below the portrait and leaves a
        step of dead space beside it. */}
    {/* max-w-5xl is the section's one measure. It used to be justified by the
        capability grid below it; the grid is gone and the measure stays,
        because it is what keeps the status card from overshooting the lede. */}
    {/* Three columns from `lg`, two below it, one on a phone.
        
        The scene is 1425px wide and this block used to be capped at `max-w-5xl`
        — so the section that opens the page left roughly 40% of its own stage
        empty, which reads as an unfinished layout rather than as air. The
        availability card moves to its own column at the width where there is
        room for it, and the measure of the prose is unchanged: it is the
        COLUMN that got narrower, not the line length. */}
    <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 sm:gap-10 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,23rem)] md:items-start">
      <motion.div variants={fadeIn("right", "spring", 0.1, 0.7)} onAnimationComplete={noteLanded} className="max-w-[260px]">
        <Portrait />
      </motion.div>

      {/* motion.div, not div: framer propagates variants only through motion
          components, so a plain wrapper here leaves the children stuck in the
          `hidden` variant at opacity 0, the same failure that hid Work. */}
      <motion.div className="flex flex-col gap-7">
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          onAnimationComplete={noteLanded}
          // Widened as a LEDE, not as a longer line. Filling the 892px column at 17px
          // would run ~126 characters a line, roughly 70% past the readable band.
          // Larger type on a wider measure fills the space and keeps ~71 characters.
          className="font-serif text-secondary text-[calc(clamp(1.1rem,1.5vw,1.35rem)*var(--type-scale,1))] max-w-[40rem] leading-[1.65]"
        >
          I work across the full data-to-AI stack and care about the problem more
          than the title.
        </motion.p>

        {/* Three things the work does, each with the thing that proves it.
            
            This replaces two sentences. "The work tends to run offline, ground
            its answers in real sources, and be easy to try in a minute" said
            exactly what these three rows say — but said it as a promise, in a
            section whose neighbours are all evidence. Every proof below is a
            project's own `outcome` string, quoted, and the reader can go and
            look at it.
            
            The other sentence was "Calm, disciplined, focused on what I can
            control." It is the one line on the page that nothing can check, and
            it is on about half the portfolios on the internet. */}
        <motion.ul variants={fadeIn("", "", 0.15, 1)} className="list-none space-y-6 max-w-[40rem]"
          onAnimationComplete={noteLanded}
          ref={claimsRef}
          data-tok={claimsSeen ? "run" : "wait"}
        >
          {PRINCIPLES.map(({ claim, project }, i) => (
            <li key={claim}>
              {/* Streams in word by word, the same way the hero's three claims
                  do. These are the other trio on the page and they were the
                  only one still arriving as a plain fade. */}
              <p className="flex items-baseline gap-3 font-sans font-medium text-white-100 text-[calc(clamp(1.02rem,1.3vw,1.18rem)*var(--type-scale,1))] leading-snug">
                {/* NOT tokenised. The rules land with the list so the three
                    slots are visibly there, waiting, while the words stream
                    into them. Fading them in with the words left the whole
                    block empty for over a second after the rest of the section
                    had landed, which reads as broken rather than as pending. */}
                <span aria-hidden="true" className="relative top-[-0.3em] h-px w-5 shrink-0 bg-accent/70" />
                <TokenText text={claim} start={i * CLAIM_GAP + 60} />
              </p>
              {/* The project's `outcome` used to be printed here, and it is
                  the Projects card's own heading — so three whole sentences
                  appeared twice on one page, a screen apart. This row's job is
                  to say WHICH project answers the claim; the card's job is to
                  say what it does. The link carries the name and nothing is
                  lost, because the name is the thing you follow. */}
              <a
                href={`#${project.name}`}
                className="mt-1 ml-8 inline-flex items-center min-h-11 sm:min-h-0 font-mono text-label text-faint hover:text-accent transition-colors"
              >
                {project.name} ↓
              </a>
            </li>
          ))}
        </motion.ul>

      </motion.div>

      {/* Its own column from `xl`, still stacked under the prose below that.
          The card is the one thing in this section a recruiter is looking for,
          and in the stacked layout it sat 900px down the page.

          `xl`, not `lg`, and this was measured after getting it wrong. At `lg`
          the three columns start at 1024px, where the scene's 144px of padding
          and 80px of gaps leave the prose column **172px wide** — four words a
          line, with `federated-yolov8-object-detection` broken across three.
          At 1280 the same layout gives the prose 428px. A three-column grid
          needs the width for three columns; the breakpoint has to be where that
          width exists, not where the columns first fit at all. */}
      <motion.div variants={fadeIn("up", "spring", 0.2, 0.7)} onAnimationComplete={noteLanded} className="md:col-span-2 xl:col-span-1">
        <Availability />
      </motion.div>
    </div>
  </>
  );
};

export default SectionWrapper(About, "about");
