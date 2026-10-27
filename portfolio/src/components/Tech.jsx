import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  stackGroups,
  TOOL_COUNT,
  TERM_HINT,
  systemPlanes,
  systemSubstrate,
  platformMatrix,
} from "../constants";
import { fadeIn } from "../utils/motion";
import Reveal from "./Reveal";
import { SectionWrapper } from "../hoc";
import SectionHead from "./SectionHead";
import TokenStream from "./TokenStream";
import TagTerm from "./TagTerm";
import StackDiagram, { DiagramControls } from "./StackDiagram";

// The count is a set, not a sum, and it is derived in one place:
// `TOOL_COUNT` in constants/stack.js, beside the data it counts. This used
// to recompute it here, which was correct but made it the second of three
// answers to the same question, and the other two had already drifted.
const STACK_META = `${stackGroups.length} areas · ${TOOL_COUNT} tools`;

// The width at which StackDiagram exists at all: it is `hidden lg:block`, and
// Tailwind's `lg` is 1024px. Written once so the default view and the resize
// guard cannot disagree with the CSS that actually hides it.
const DIAGRAM_WIDTH = "(min-width: 1024px)";

const stageNo = (i) => String(i + 1).padStart(2, "0");

/**
 * WHERE A TERM SITS IN THE SYSTEM — the extra line the panel now carries.
 *
 * Derived, never typed: a tool is looked up in the planes that already own it
 * and a role in the matrix that already places it. Writing this by hand would
 * be a third list of the same strings, which is the drift this section
 * already has a test for.
 */
const PLACE = (() => {
  const at = {};
  for (const plane of systemPlanes) {
    for (const node of plane.nodes) {
      for (const it of node.items) at[it] = `${plane.title} · ${node.title}`;
    }
  }
  for (const node of systemSubstrate.nodes) {
    for (const it of node.items) at[it] = `${systemSubstrate.title} · ${node.title}`;
  }
  for (const r of platformMatrix) {
    at[r.role] = r.mine ? `${r.plane} plane · filled here by ${r.mine}` : `${r.plane} plane · no tool of mine in this slot`;
  }
  return at;
})();

/* A search URL rather than an article URL, and that is the honest choice.
   Guessing 80 exact Wikipedia titles would ship dead links; a search never
   404s and lands the reader on the article or on a list containing it. */
const wikiSearch = (name) =>
  `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`;

/**
 * Owns, the one place a tool's definition is read.
 * Does not own: which tool that is — the section decides, from hover and taps.
 *
 * It replaced thirty-three floating popovers. Those failed twice over: the
 * surface was `rgba(255 255 255 / 0.62)`, so a definition rendered over a card
 * full of chips could not be read through its own background, and hover-open
 * plus click-pin let two sit on screen overlapping each other.
 *
 * A fixed slot cannot cover anything, cannot be clipped by the row below, and
 * gives a reader ONE place to look — which matters more here than anywhere
 * else on the page, because a recruiter meeting an unfamiliar tool is exactly
 * who this section is for.
 *
 * It holds its height whether or not anything is selected. A panel that
 * appears and disappears would move the rail and the heading beside it on
 * every hover, and the fix for a jumpy section is not a jumpier one.
 */
/**
 * ONE LINE, UNDER THE CONTROLS, ABOVE THE TOOLS.
 *
 * It was a bordered card in the header's right column, and the owner's reading
 * of that was correct: it left the whole band beside the heading and the intro
 * doing nothing. A definition is one sentence and some links — it does not
 * need a 512x104 card to hold it, and the card was reserving a column that the
 * animation could use instead.
 *
 * Flattened to a rule and a line of text, it sits directly above the terms it
 * describes rather than diagonally across from them, and the right half of the
 * header is free for the token stream to run through.
 *
 * It still RESERVES its height. A strip that appears on hover would move every
 * tool under it on each pointer crossing, which is the fault the card was
 * built to avoid; that reasoning did not change when the shape did.
 */
const DefinitionStrip = ({ entry, pinned }) => (
  <div
    className="hidden md:block min-h-[2.75rem] border-t border-line pt-2"
    aria-live="polite"
  >
    {entry ? (
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-[14px] font-semibold tracking-[-0.01em] text-white-100">
          {entry.name}
        </span>
        {entry.full && entry.full !== entry.name && (
          <span className="font-mono text-micro text-faint">{entry.full}</span>
        )}
        {pinned && (
          <span className="font-mono text-micro uppercase tracking-[0.12em] text-accent-ink">
            pinned
          </span>
        )}
        <span className="min-w-0 flex-1 font-sans text-data leading-snug text-secondary">
          {entry.def}
        </span>
        {entry.place && (
          <span className="shrink-0 font-mono text-micro uppercase tracking-[0.08em] text-faint">
            {entry.place}
          </span>
        )}
        <span className="shrink-0 font-mono text-chip">
          {entry.link && (
            <a
              href={entry.link}
              target="_blank"
              rel="noreferrer"
              className="text-accent-ink hover:underline"
            >
              Learn more ↗
            </a>
          )}{" "}
          <a
            href={wikiSearch(entry.full || entry.name)}
            target="_blank"
            rel="noreferrer"
            className="ml-2 text-faint hover:text-accent-ink hover:underline"
          >
            Wikipedia ↗
          </a>
        </span>
      </p>
    ) : (
      <p className="font-serif italic text-label leading-[1.5] text-faint">
        {TERM_HINT} Tap one to keep it here.
      </p>
    )}
  </div>
);

const ViewToggle = ({ view, onChange }) => (
  /* IDENTICAL IN BOTH VIEWS, which it was not. In the list it carried the
     invitation "Would you like to see this as a system diagram?" and sat in
     the header's right column; in the diagram it dropped the question and
     moved to the end of the controls row. Reported: "it looks different when
     I click on system diagram — try to get them into the same thing always."
     Right. A control that changes its words, its width and its position
     depending on what it last did is a different control each time, and the
     reader has to find it again after every click.

     The invitation went rather than the label, because an invitation is the
     half that cannot be state-neutral: asking "would you like to see this as
     a system diagram?" beside a system diagram reads as a control that has
     not noticed its own state. The two buttons say what they do. */
  <div className="hidden lg:flex shrink-0 items-center gap-3">
    <span className="font-mono text-micro uppercase tracking-[0.12em] text-faint">
      View
    </span>
    <div
      role="group"
      aria-label="Stack view"
      className="flex items-center gap-1 rounded-full border border-line p-0.5"
    >
      {[
        ["list", "Tool list"],
        ["diagram", "System diagram"],
      ].map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={view === id}
          className={`rounded-full px-3 py-1 font-mono text-micro uppercase tracking-[0.12em] transition-colors ${
            view === id
              ? "bg-white-100 text-primary font-semibold"
              : "text-faint hover:text-white-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

const Tech = () => {
  // Which group the pointer is on, or null. Drives only the rail above the
  // grid: the cards light themselves in CSS, which needs no state at all.
  const [active, setActive] = useState(null);

  /**
   * ONE definition panel for every term in the stack.
   *
   * `hovered` is what the pointer is over; `pinned` is what a tap fixed in
   * place. Pinned wins, so a reader can park a definition and keep scanning
   * without it being stolen by whatever the cursor crosses next.
   *
   * Both live here rather than in the chips because "only one is showing" is a
   * fact about the section. Thirty-three components each owning a popover is
   * how two ended up on screen at once.
   */
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const withPlace = (e) => (e ? { ...e, place: PLACE[e.name] } : e);
  const shown = withPlace(pinned ?? hovered);

  /**
   * Which reading of the stack is on screen. Defaults to the list, and that
   * default is deliberate: the list is what a recruiter scanning for a
   * keyword needs, and it is the one that works at every width. The diagram
   * is the better answer to "do these fit together", which is a question the
   * reader has to be interested enough to ask.
   *
   * Not persisted. A remembered view means a reader returning to the page
   * lands on a diagram they chose once, weeks ago, with no memory of choosing
   * it -- which reads as the site being broken rather than as a preference
   * being honoured.
   */
  /**
   * WHICH READING OPENS FIRST, and why it is not the flat list any more.
   *
   * `systemPlanes` files the same tools as 17 nodes of 1-9 with a plain-English
   * role line each; `stackGroups` files them as 6 groups of 5-13, which at `xl`
   * puts all 56 terms on screen at once. The second answers "what does he know",
   * the first answers "how does it fit together" - and the first is the question
   * an interview actually asks. It was the one behind an 11px uppercase control
   * at the far right of the controls row, defaulted off, so most readers never
   * saw it.
   *
   * The flat list is still one click away and is genuinely better at one thing:
   * scanning for a specific tool name.
   *
   * ONLY FROM `lg`. Below 1024px `StackDiagram` is `hidden lg:block`, so opening
   * in diagram view on a narrow screen would render no stack at all. The planes
   * are not yet drawn for a phone - that is still to do - so a narrow viewport
   * opens on the list, which is what it has always had.
   */
  const [view, setView] = useState(() =>
    window.matchMedia(DIAGRAM_WIDTH).matches ? "diagram" : "list"
  );

  /**
   * Closes a blank window that predates the new default. Between `md` and `lg`
   * the desktop grid is hidden when `view === "diagram"`, the diagram itself is
   * `hidden lg:block`, and the phone list is `md:hidden` - so at 768-1023px in
   * diagram view the section renders NOTHING. It was unreachable only because
   * the toggle was never offered below `lg`; a reader at 1200px who chose the
   * diagram and then narrowed their window fell straight into it.
   *
   * Narrowing therefore forces the list back. Widening again deliberately does
   * not re-open the diagram: by then the reader may have chosen the list on
   * purpose, and a view that changes under you while you read it is worse than
   * one that stays put.
   */
  useEffect(() => {
    const mq = window.matchMedia(DIAGRAM_WIDTH);
    const on = () => { if (!mq.matches) setView("list"); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Lifted out of StackDiagram because its CONTROL sits in the header, where
  // there is free vertical space, while the thing it controls sits below the
  // header. See PlatformPicker's own comment.
  const [why, setWhy] = useState(false);
  const [platform, setPlatform] = useState("oss");
  const [compact, setCompact] = useState(false);

  // Shared by both views, so a term pinned in the list is still pinned when
  // the reader switches to the diagram. Written once rather than inline in
  // each view: two copies of a toggle-the-pin rule is two chances for them to
  // disagree about what a second tap does.
  const pinTerm = (e) => setPinned((p) => (p?.name === e.name ? null : e));

  return (
    <>
      {/* The token stream, back and boxed.
          It belongs here -- this is the section with the LLM / RAG group, so a
          stream of sub-word pieces illustrates the content rather than
          decorating the page. What was wrong was its SIZE, not its presence:
          at `w-[52%]` it measured a 416x106px overlap with the intro paragraph
          (the whole paragraph) and another 416x19 with the hint. Deleting it
          was the wrong correction.

          Confined to the top-right block instead, which is the one region the
          new layout genuinely leaves empty -- above the definition panel and
          clear of the text column. The repo's rule is that ambient work must
          not cross text, not that it cannot exist. */}
      <TokenStream />

      {/* HEADER IN TWO COLUMNS, and the argument stays with the heading.
          The first attempt put the intro in the right column and the panel
          under it. That left 244px of measured dead space under "Stack" on the
          left, because the right column was the taller of the two and the grid
          waits for both. Reading order suffered too: the eye had to cross the
          page to find the sentence that explains the section.
          Heading and argument together on the left; the panel takes the right,
          which is the half that was empty to begin with.

          `items-end`, not `items-start`. Aligned to the top, the panel sat at
          the top right while the tools it describes were ~400px below it, so
          pointing at a chip meant reading the answer at the other end of the
          section. Dropped to the baseline of the header it sits directly above
          the columns, and the slack moves up beside the display-size heading,
          where open space reads as intent rather than as a gap. */}
      {/* ONE COLUMN. The second held the definition card; with that gone the
          whole right of the header is free, which is what the token stream
          now runs through. */}
      <div>
        <div className="min-w-0">
          <SectionHead title="Stack" meta={STACK_META} />

          <motion.p
            variants={fadeIn("", "", 0.1, 1)}
            // Desktop only. On a phone this section is a list of tools and the
            // argument for them is three lines the reader scrolls past.
            className={`${
              view === "diagram" && compact ? "hidden" : "hidden md:block"
            } mt-4 min-h-[5rem] max-w-[46rem] font-sans text-secondary text-body leading-[1.65]`}
            // RESERVED HEIGHT, so the controls below do not move when the view
            // changes. The two intros are different lengths -- three lines in
            // the list, two in the diagram -- which shifted the whole control
            // strip 26px on every toggle. A control that jumps when you use it
            // is the same complaint as one that changes shape.
          >
            {view === "diagram" ? (
              /* VIEW-SPECIFIC, and not as a trick to save height -- though it
                 saves 56px, which is why it got looked at. The list's sentence
                 says the tools are "grouped by where it sits on the path from
                 raw data to a running product". In the diagram that path is
                 drawn, with the stages named and the edges labelled, so the
                 sentence is describing something the reader is looking at.
                 What they need instead is how to READ the drawing. */
              <>
                The same tools, filed by the job they do in a system rather
                than by what I would call the skill. Hover any one for what it
                is; pick a platform to see what fills its role there.
              </>
            ) : (
              <>
                Not a badge collection: this is what I actually reach for,
                grouped by where it sits on the path from raw data to a running
                product. I pick tools that are boring in production:
                measurable, reproducible, and easy to hand off.
              </>
            )}
          </motion.p>

        </div>

        {/* The panel is the whole right column now, and it STRETCHES to the
            row rather than hanging off the bottom of it. Bottom-aligned it
            left its own gap above itself once the toggle moved out; filling
            the row also gives a long definition more room before it has to
            wrap, which is the only thing that was ever cramped about it. */}
        <div className="flex flex-col gap-3">
            {/* LIST VIEW ONLY, and it is free here. The right column holds a
              144px panel against a 229px left column, so a 30px control fits
              in the slack and the section does not grow. Given its own strip
              below the header it cost a measured 54px — for a control that
              had somewhere free to be.

              In the diagram view it moves to the end of the controls row,
              which is where it was asked to go and where its siblings are.
              Both positions are right-aligned and directly above the content,
              so the control does not travel far when the view changes. */}
        </div>
      </div>

      {/* Two shapes, because a phone and a desktop want different things here.
          On a phone this is one block with six labelled rows: six bordered cards
          each carrying a description was most of a screen per card for content
          that is really a list. Cards return at md, where there is room for the
          description to earn its place. Each row and each card still reveals on
          its own viewport entry, so the section animates as the reader arrives
          at it rather than all at once. */}
      {/* The diagram's own controls: `?`, platform, and the view toggle at
          the end. Rendered only for the view they act on — a vendor picker
          above a tool list would be a control with nothing to change. */}
      {/* ONE STRIP, ALWAYS, so the toggle never moves. In the list view it
          holds the toggle alone; in the diagram the `?`, the platform picker
          and the fit control take the left and the toggle keeps the right.
          It costs the list view ~54px, which it can now afford — the section
          is 0.87 screens — and it buys a control that is in the same place
          before and after every click. */}
      <div className="mt-6 hidden md:block">
        <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1">
            {view === "diagram" && (
              <DiagramControls
                why={why}
                onWhy={() => setWhy((v) => !v)}
                platform={platform}
                onPlatform={setPlatform}
                compact={compact}
                onCompact={() => setCompact((v) => !v)}
              />
            )}
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
        <DefinitionStrip entry={shown} pinned={Boolean(pinned)} />
      </div>

      {/* The gap above the body closes when the reader has asked for less
          detail. Compact is a request for height, and 24px of air above the
          drawing is height the drawing can use. The list view keeps its 24px:
          nobody asked it to shrink. */}
      <div className={view === "diagram" && compact ? "mt-3" : "mt-6"}>
        {/* phone: six labelled rows of flowing terms, no card and no chips.
            Boxed, this was thirty-three bordered rectangles about 50px tall — a
            form, not a vocabulary, and most of a screen per group. Bare terms
            carry the same two tiers in weight and colour, and the dotted
            underline still marks what is definable. The wave that used to sit
            above this is gone: at 390px it rendered as struck-through fragments
            in a band of its own and read as a glitch rather than a stream.

            The number on the right was the group's tool count and is now its
            stage number, so a phone and a desktop tell the same story about the
            order. The count was never the interesting number: the tools it
            counts are on the next line.

            The tinted left rule replaces the row divider and the dot. It does
            the same separating job a grey hairline did and, unlike the hairline,
            it carries the category colour down the whole row instead of into one
            8px circle. */}
        <div className="md:hidden flex flex-col gap-5">
          {stackGroups.map((g, i) => (
            <Reveal
              key={g.title}
              delay={i * 0.06}
              y={12}
              className="border-l-2 pl-4"
              style={{ borderColor: `rgb(var(${g.tint}) / 0.8)` }}
            >
              <h3 className="flex items-baseline gap-2">
                <span className="font-display text-[15px] font-semibold text-white-100 tracking-[-0.01em]">
                  {g.title}
                </span>
                {/* Inside the <h3>, unlike the desktop variant below, so
                    without this the group's accessible name is "Data
                    engineering01". Same reason the Roles stage numeral is
                    hidden: it is a position marker, not part of the name. */}
                <span
                  aria-hidden="true"
                  className="stack-index ml-auto font-mono text-micro"
                  style={{ "--cat": `var(${g.tint})` }}
                >
                  {stageNo(i)}
                </span>
              </h3>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0">
                {g.items.map((it) => (
                  <TagTerm key={it} name={it} flow primary={g.primary?.includes(it)} />
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        {/* md and up: the cards, with the descriptions.
            Reveal stays the motion wrapper and the card is a plain child of it,
            so the pointermove handler writes --mx/--my to an element that
            framer-motion is not also writing a style attribute to. */}
        {/* THE PATH RULE CAME OUT, and it was the fourth statement of one fact.

           It was a segmented rail of six tinted bars, then a line reading
           "FROM RAW DATA ---- TO A RUNNING PRODUCT". The columns already run
           left to right, they are already numbered 01-06, they already carry
           their own tint bar, and the intro paragraph directly above already
           says "grouped by where it sits on the path from raw data to a
           running product" -- the same words. A label with no sentence around
           it is what made "what does RAW DATA mean here?" a fair question;
           the sentence that answers it was always three lines up.

           It also cost 41px of a section under a one-screen budget that now
           carries 47 terms. Measured: 897px to 856px, 1.02 screens to 0.97. */}

        {/* SIX COLUMNS, ONE ROW — the pipeline IS the layout.
            A 3x2 grid of cards states six categories and throws the ordering
            away; the rail above had to draw it back. Laid left to right, the
            columns are the path, and the section stopped being 1.34 screens
            tall.

            Six only from `xl`. Below that the columns would be narrower than
            the longest chip ("Exploratory analysis"), so it steps down to
            three and then two rather than letting a tool name wrap mid-word. */}
        {/* The diagram, when it is asked for. Below `lg` the toggle is not
            offered and `view` can only be "list", so the grid remains the one
            thing a tablet or a phone can reach. */}
        {view === "diagram" && (
          <StackDiagram
            platform={platform}
            compact={compact}
            onDefine={setHovered}
            onPin={pinTerm}
            shown={shown}
          />
        )}

        <div
          className={`${
            view === "diagram" ? "hidden" : "hidden md:grid"
          } md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-x-4 gap-y-7 items-start`}
        >
          {stackGroups.map((g, i) => (
            <Reveal
              key={g.title}
              // By column, so the row arrives as a row travelling left to
              // right — the same direction the pipeline reads.
              delay={(i % 6) * 0.06}
              className="min-w-0"
            >
              <div
                className="flex min-w-0 flex-col"
                style={{ "--cat": `var(${g.tint})` }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                {/* The tint rule is what ties a column to its segment in the
                    rail above. It replaces the card border: six bordered boxes
                    side by side read as a table, and the colour already does
                    the grouping the border was doing. */}
                <span
                  aria-hidden="true"
                  className="h-[3px] w-full rounded-full"
                  style={{
                    background: `rgb(var(${g.tint}))`,
                    opacity: active === null ? 0.55 : active === i ? 1 : 0.2,
                  }}
                />
                <div className="mt-3 flex items-baseline gap-2">
                  <h3 className="font-display text-[15px] font-semibold text-white-100 tracking-[-0.01em] leading-tight">
                    {g.title}
                  </h3>
                  <span className="stack-index ml-auto shrink-0 font-mono text-[15px] font-medium leading-none">
                    {stageNo(i)}
                  </span>
                </div>
                {g.note && (
                  <p className="mt-1.5 font-serif text-secondary text-label leading-[1.45]">
                    {g.note}
                  </p>
                )}
                {/* BARE WORDS, not boxes — the treatment this file already
                    uses on a phone, for the reason it already gives there:
                    "the dotted underline does all the work the border was
                    doing... same information, a fifth of the ink."

                    Boxed, a 200px column could not hold "Detection & tracking"
                    or "Exploratory analysis" on one line, so those two chips
                    broke across two lines and stood 45px tall against 25px for
                    every other chip — measured. And the primary tier was a
                    solid near-black fill, so twelve of thirty-three tools were
                    the heaviest marks in the section, competing with the
                    heading for no stated reason.

                    Bare, a long name simply wraps as text, and the tier is
                    carried by weight and colour the way the rest of the page
                    carries emphasis. */}
                <div className="mt-3 flex flex-col items-start gap-y-0.5">
                  {g.items.map((it) => (
                    <TagTerm
                      key={it}
                      name={it}
                      flow
                      dense
                      primary={g.primary?.includes(it)}
                      onDefine={setHovered}
                      onPin={pinTerm}
                      active={shown?.name === it}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
};

export default SectionWrapper(Tech, "stack", { wide: true, tight: true });
