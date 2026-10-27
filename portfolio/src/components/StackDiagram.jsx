import {
  systemPlanes,
  systemSubstrate,
  platformMatrix,
  PLATFORMS,
  PLATFORM_NOTE,
  PLATFORM_DOCS,
  PLATFORM_CHECKED,
  DIAGRAM_WHY,
} from "../constants";
import Reveal from "./Reveal";
import TagTerm from "./TagTerm";

/**
 * Owns, the stack drawn the way it would be drawn on a whiteboard.
 * Does not own: which tools exist, or what any of them means. Those are
 * `systemPlanes` and `glossary` in `../constants`, and `utils/stages.test.mjs`
 * fails if this diagram and the tool list stop covering the same 47 terms.
 *
 * WHY THE BOXES ARE NOT HIS SKILL AREAS
 *
 * The first version drew one box per `stackGroups` entry: Data engineering,
 * Data science, Computer vision. It fit on a screen, it was tidy, and it was
 * the tool list with arrows added -- because the boxes were still categories
 * of a PERSON rather than parts of a SYSTEM.
 *
 * Nobody draws a box called "Data engineering" in a design interview. The
 * boxes are the jobs the system has to do, and the tools are what drops into
 * each slot. That reframing is what makes the useful sentence available:
 * "Airflow orchestrates here; on GCP that is Composer, on AWS that is MWAA --
 * same role." A list of skills cannot get near that sentence.
 *
 * WHY BANDS AND NOT COLUMNS
 *
 * Five boxes in a row gave each stage about 200px, and the tool list wrapped
 * inside 200px looked exactly like what it was reported as: "all the skills are
 * scattered... they are not looking like tool list." Ragged two- and
 * three-word wraps, every box breaking in a different place, no two tools
 * sharing a left edge.
 *
 * Full-width bands give every stage ~1,000px, so its tools sit on one line, in
 * one row, aligned. The pipeline still reads top to bottom through the labelled
 * arrows, which is how a layered system diagram is normally drawn anyway. The
 * fork is the one place two bands sit side by side, because that is the claim.
 *
 * WHY NO MEASURED CONNECTORS. The obvious build anchors an SVG to the boxes
 * and redraws on resize. That is what the hero field does and what cost this
 * repo its longest bug: a canvas that measured correctly and drew wrong,
 * because a replaced element does not size the way its insets say. Here the
 * connectors are LAYOUT, so there is nothing to measure and no second opinion
 * about where a box is.
 */

const nodeNo = (i) => String(i + 1).padStart(2, "0");
/* The chosen platform's own colour. `oss` is the site accent, because the
   stack he actually runs is the point of the page; the three clouds get the
   categorical hues defined in index.css. */
const platTint = (platform) =>
  platform === "oss" ? "--c-accent" : `--c-plat-${platform}`;

/**
 * WHAT MOVES between two stages -- and it has to look nothing like a tool.
 *
 * This was a lowercase word in faint mono sitting between two hairlines, which
 * is the exact typographic treatment the tool names beside it use. Reported,
 * correctly: "I don't see a differentiate between the diagram and the tables,
 * the feature, they are looking the same kind of skills here." A reader
 * scanning the column saw `Airflow`, `PySpark`, `tables`, `pandas` and had no
 * way to know one of those is not a tool he uses.
 *
 * So the payload now carries every signal a tool name does not: a downward
 * arrowhead, a dashed capsule rather than a bare word, uppercase with wide
 * tracking, and the accent ink that nothing in the term list uses. A dashed
 * outline is also the convention for a thing in transit rather than a thing
 * that exists, which is what these are.
 */
const Step = ({ label, compact }) =>
  compact ? (
    /* In compact the payload keeps its words and loses its box: the capsule,
       the two stubs and the vertical padding are 34px each, and three of them
       is most of a plane row. */
    <div className="flex items-center justify-center gap-1.5 py-[1px]">
      <svg width="7" height="7" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0 fill-accent-ink">
        <path d="M4 8 0 0h8z" />
      </svg>
      <span className="font-mono text-micro uppercase tracking-[0.12em] text-accent-ink">
        {label}
      </span>
    </div>
  ) : (
  <div className="flex flex-col items-center">
    <span aria-hidden="true" className="h-1.5 w-px bg-line" />
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-accent/45 px-2.5 py-[3px]">
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        aria-hidden="true"
        className="shrink-0 fill-accent-ink"
      >
        <path d="M4 8 0 0h8z" />
      </svg>
      {/* The screen-reader text says what the capsule means, because the
          arrow and the dashes are the only thing carrying that meaning for a
          sighted reader and neither survives being read aloud. */}
      <span className="sr-only">passes to the next stage: </span>
      <span className="font-mono text-micro uppercase tracking-[0.16em] text-accent-ink">
        {label}
      </span>
    </span>
    <span aria-hidden="true" className="h-1.5 w-px bg-line" />
  </div>
  );

/**
 * One node: a job the system has to do, and what fills it.
 *
 * `flow` is the PLANE's colour, not the node's — every node in a plane shares
 * it, because the colour encodes depth in the flow and these are all at the
 * same depth. That is the whole reason the palette stopped being six hues:
 * identical intensity is a claim ("same stage"), and a categorical palette
 * cannot make it.
 */
const Node = ({ node, index, flow, platform, compact, onDefine, onPin, shown }) => {
  const cloud = platform !== "oss";
  const roles = cloud ? platformMatrix.filter((r) => r.node === node.id) : [];
  return (
    <div
      className={`node-walk flex min-w-0 flex-1 flex-col rounded-lg border border-line border-t-[3px] bg-tertiary/50 px-3 ${compact ? "py-1.5" : "py-2"}`}
      style={{
        borderTopColor: `rgb(var(${flow}))`,
        "--w": index,
        "--walk": `var(${flow})`,
      }}
    >
      {/* THE HEADER OF THE BOX: what it is, then what it is FOR. Three kinds
          of text live in this card and they used to differ only by weight, so
          a reader got "some kind of light change" rather than a structure.
          Each now has its own voice: the title is display, the responsibility
          is serif ITALIC — the page's register for commentary rather than
          data — and the contents below the rule are mono, which is what this
          site uses for things that are names. */}
      <h4 className="flex items-baseline gap-2 font-display text-[13px] font-semibold leading-tight tracking-[-0.01em] text-white-100">
        <span
          aria-hidden="true"
          className="font-mono text-[10px] font-medium leading-none"
          style={{ color: `rgb(var(${flow}))` }}
        >
          {nodeNo(index)}
        </span>
        {node.title}
      </h4>
      {/* COMPACT drops the responsibility line, which is the single biggest
          thing in the card after its contents. It is the sentence that makes
          a box a slot rather than a label, so it is the reader's to discard —
          not mine. */}
      {!compact && (
        <p className="mt-0.5 font-serif italic text-label leading-[1.3] text-faint">
          {node.role}
        </p>
      )}

      {/* A LITERAL RULE between the card's argument and its contents. The
          reported fault was that the explanation and the tool names ran
          together; a hairline is the cheapest unambiguous separation there
          is, and it costs one pixel. */}
      <div className={`${compact ? "mt-1.5 pt-1.5" : "mt-2 pt-2"} border-t border-line/60`}>
        {cloud ? (
          roles.length ? (
            compact ? (
              /* COMPACT DROPS THE ROLE COLUMN AND FLOWS THE SERVICES.
                 The cloud view's height is set by its ROW COUNT -- 33 roles,
                 one line each -- and the old compact mode only trimmed the
                 description lines, so it saved 104px on a view that was 591px
                 over. The control promised "fit to screen" and did not fit,
                 which is worse than not offering it.
                 Flowed, a six-service node is two lines instead of six. The
                 roles are still there in full detail, which is the trade the
                 button is for. */
              /* EVERY ITEM CARRIES ITS ROLE'S MARK. Flowed as bare names
                 separated by interpuncts this read as one run-on string —
                 "still scattered", and fairly. A glyph in front of each name
                 is non-verbal punctuation: the eye finds the boundaries
                 without reading a word, and the same mark means the same slot
                 in every platform and in full detail. The chip still defines
                 the ROLE on hover; only the text it prints changes. */
              <div className="cloud-in flex flex-wrap content-start gap-x-3 gap-y-0.5">
                {roles.map((r) => (
                  <TagTerm
                    key={r.role}
                    name={r.role}
                    label={r[platform]}
                    flow
                    dense
                    onDefine={onDefine}
                    onPin={onPin}
                    active={shown?.name === r.role}
                  />
                ))}
              </div>
            ) : (
              <ul className="list-none space-y-[3px]">
                {roles.map((r, i) => (
                  <li
                    key={r.role}
                    /* `items-start`, and the role never wraps. Reported:
                       "catalog & governance is sticking to the other new
                       line". With both halves wrapping freely the role broke
                       mid-phrase and the service climbed into the gap, so
                       neither read as one thing. */
                    className="cloud-in flex items-start gap-x-2 leading-[1.45]"
                    style={{ "--i": i }}
                  >
                    {/* The ROLE is the dotted term, not the service: it is
                        the part that stays true when a vendor renames a
                        product, so one definition covers all four columns. It
                        brings its own mark, so every row has a symbol on
                        every platform. */}
                    <TagTerm
                      name={r.role}
                      flow
                      dense
                      onDefine={onDefine}
                      onPin={onPin}
                      active={shown?.name === r.role}
                    />
                    <span
                      className="min-w-0 flex-1 text-right font-mono text-micro leading-[1.5]"
                      style={{ color: `rgb(var(${platTint(platform)}))` }}
                    >
                      {r[platform]}
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : (
            /* NOT A GAP — a finding. Federated training, the classical model,
               the interface and the language it is written in have no managed
               equivalent anywhere, because they are not platform choices.
               Saying so is more useful than a box that looks unfinished. */
            <p className="cloud-in font-serif italic text-label leading-[1.4] text-faint opacity-80">
              Unchanged — not a platform choice.
            </p>
          )
        ) : (
          <div className="flex flex-wrap content-start gap-x-3 gap-y-0.5">
            {node.items.map((it) => (
              <TagTerm
                key={it}
                name={it}
                flow
                dense
                onDefine={onDefine}
                onPin={onPin}
                active={shown?.name === it}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * A plane: a row of nodes that sit at the same depth, with the plane's own
 * identity down the left.
 *
 * `parallel` changes what the row ASSERTS. In the data plane the nodes are a
 * sequence — ingest, then store, then shape — so thin rules sit between them.
 * In the model plane they are alternatives; most projects use one or two, and
 * a connector between "object detection" and "retrieval" would claim a
 * dependency that does not exist.
 */
const Plane = ({ plane, offset, platform, compact, onDefine, onPin, shown }) => (
  <section aria-label={plane.title}>
    {/* THE PLANE LABEL SITS ABOVE ITS ROW, not in a column beside it. As a
        9.5rem left column it took 152px off every row for two short lines of
        text that are read once. Above the row it costs ~18px of height and
        gives all of that width back to the cards, which is what the cards
        needed: wider boxes wrap their contents in fewer lines, so the change
        pays for its own height twice over. */}
    <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <span
        className="font-display text-[12px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: `rgb(var(${plane.flow}))` }}
      >
        {plane.title}
      </span>
      {!compact && (
        <span className="font-serif italic text-label text-faint">
          {plane.role}
        </span>
      )}
      {plane.parallel && (
        <span className="font-mono text-micro uppercase tracking-[0.1em] text-faint opacity-60">
          · alternatives, not steps
        </span>
      )}
    </h3>
    <div className="mt-1.5 flex items-stretch gap-2">
      {plane.nodes.map((node, i) => (
        <Node
          key={node.id}
          node={node}
          index={offset + i}
          flow={plane.flow}
          platform={platform}
          compact={compact}
          onDefine={onDefine}
          onPin={onPin}
          shown={shown}
        />
      ))}
    </div>
  </section>
);

/**
 * THE PLATFORM PICKER, which now redraws the diagram rather than a table.
 *
 * Three designs, and the third is the one that earned its place. First a
 * per-tool switch that rewrote `S3` to `Cloud Storage` in place — compact, and
 * it hid the equivalence by only ever showing one side. Then a 33-row
 * comparison table beside the drawing, which showed both sides and put ~165
 * cells on top of the thing that was actually the argument.
 *
 * The owner's objection cut through both: "why show `Airflow -> MWAA` if you
 * are only showing AWS? You can directly show the image." Right on both
 * counts. The arrow is only worth its space when both ends are visible, and a
 * table next to a diagram is a description of a picture that is already there.
 *
 * So the DIAGRAM is the view. Pick a platform and the same architecture fills
 * with that platform's services — the planes, the nodes and the flow hold
 * still, and only the slots change. That is the claim stated as a demo rather
 * than as a mapping: the system is the same, the managed pieces are swappable.
 */
export const DiagramControls = ({ why, onWhy, platform, onPlatform, compact, onCompact }) => {
  const docs = PLATFORM_DOCS[platform];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <WhyPanel open={why} onToggle={onWhy} />
        <div
          role="group"
          aria-label="Platform"
          className="flex shrink-0 items-center gap-1 rounded-full border border-line p-0.5"
        >
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPlatform(p.id)}
              aria-pressed={platform === p.id}
              /* Each platform wears its own colour when chosen, so the
                 diagram's state is readable without reading the label — and
                 the same hue then appears on every service name below, which
                 is what ties the control to what it changed. */
              style={
                platform === p.id
                  ? { background: `rgb(var(${platTint(p.id)}))`, color: "rgb(var(--c-bg-deep, 12 14 18))" }
                  : undefined
              }
              className={`rounded-full px-2.5 py-1 font-mono text-micro uppercase tracking-[0.1em] transition-colors ${
                platform === p.id ? "font-semibold" : "text-faint hover:text-white-100"
              }`}
            >
              {p.short}
            </button>
          ))}
        </div>
        {/* The provider's own reference, which is what was asked for. One
            stable root per platform rather than 99 deep service links: cloud
            vendors reorganise docs constantly and a dead link on a portfolio
            is worse than no link. */}
        {/* MINIMISE, and it is the reader's call rather than mine. The
            diagram does not fit a screen at sixteen nodes, and the two things
            that would make it fit — the plane descriptions and the per-node
            responsibility lines — are the sentences that make each box a slot
            rather than a label. Cutting them permanently would be trading the
            point of the view for its height. Offering the trade is not.

            THE LABEL SAID "fit to screen" AND THAT WAS NOT TRUE. Measured
            2026-10-16, section height as a multiple of the viewport:

              1920x1080  0.98   fits
              1440x900   1.28   does not
              1366x768   1.50   does not

            It fits one screen size. A control whose label is a promise it
            keeps on a 1080p monitor and breaks on every laptop is worse than
            an honestly named one, because the reader who clicks it and still
            has to scroll concludes the page is broken rather than that the
            drawing is big. The button now says what it does — it removes
            detail — and makes no claim about the result.

            Making the claim true needs pagination, not a shorter label: four
            planes at 169px each cannot reach a 768px screen without taking
            the type below 10px. That is a separate decision about what the
            diagram says, not about how tall it is. */}
        <button
          type="button"
          onClick={onCompact}
          aria-pressed={compact}
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-micro uppercase tracking-[0.1em] transition-colors ${
            compact
              ? "border-line bg-tertiary text-white-100"
              : "border-line text-faint hover:text-white-100"
          }`}
        >
          {compact ? "↕ full detail" : "↕ less detail"}
        </button>
        {docs && (
          <a
            href={docs.href}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 font-mono text-micro hover:underline"
            style={{ color: `rgb(var(${platTint(platform)}))` }}
          >
            {docs.label} ↗
          </a>
        )}
      </div>
      {/* The date is the honest half of naming cloud products: they get
          renamed constantly, and a reader meeting a stale name cannot tell
          whether the page is old or they are. Dating the claim beats
          pretending it is permanent. */}
      <p className="mt-2 font-serif italic text-label leading-[1.5] text-faint">
        {PLATFORM_NOTE}
        {platform !== "oss" && (
          <span className="not-italic font-mono text-micro opacity-70">
            {" "}· names checked {PLATFORM_CHECKED}
          </span>
        )}
      </p>
    </div>
  );
};

/**
 * The `?`, and it is the same affordance the hero field carries.
 *
 * A visualisation that needs explaining should carry its own explanation. The
 * owner asked for this directly -- "just like you have question mark for the
 * neural network so that the user understands what we are trying to say here"
 * -- and the reasoning is the same in both places: the author knows why the
 * picture is shaped this way and the reader has three seconds to work it out.
 *
 * In FLOW, not a popover. It costs height only while it is open, and it is
 * open only because a reader asked, so it can never cover anything.
 */
const WhyPanel = ({ open, onToggle }) => (
  <>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-micro uppercase tracking-[0.1em] text-faint transition-colors hover:text-white-100"
    >
      <span aria-hidden="true" className="font-semibold">
        ?
      </span>
      why a diagram
    </button>
    {open && (
      <div className="mt-2 w-full rounded-lg border border-line bg-tertiary/50 px-3 py-2.5">
        {DIAGRAM_WHY.map((line) => (
          <p
            key={line}
            className="mt-1 font-serif text-label leading-[1.55] text-secondary first:mt-0"
          >
            {line}
          </p>
        ))}
      </div>
    )}
  </>
);

const StackDiagram = ({ platform = "oss", compact = false, onDefine, onPin, shown }) => {
  const pass = { platform, compact, onDefine, onPin, shown };
  // Running count, so the node numbers read 01..16 straight down the drawing
  // rather than restarting inside every plane.
  let n = 0;

  return (
    /* `lg` and up. A layered architecture at 390px is sixteen stacked boxes,
       which is the tool list again with more borders. The phone keeps the
       list. */
    <Reveal delay={0.1} className="hidden lg:block">
      <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
        {systemPlanes.map((plane) => {
          const offset = n;
          n += plane.nodes.length;
          return (
            <div key={plane.id} className="flex flex-col gap-2">
              <Plane plane={plane} offset={offset} {...pass} />
              {plane.out && <Step label={plane.out} compact={compact} />}
            </div>
          );
        })}

        {/* THE SUBSTRATE, and it gets no arrow into it on purpose. Nothing
            flows into Python or Docker; everything above simply runs on them.
            Dashed and off the colour ramp, because it is not a position on
            the path -- it is the floor under all of it. */}
        <section className="mt-1" aria-label={systemSubstrate.title}>
          {/* The substrate labels itself the same way the planes do — above
              its row, not in a column beside it. It kept the old left-column
              layout when the planes moved, so its heading sat 152px in from
              an edge every other label started at. */}
          <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-secondary">
              {systemSubstrate.title}
            </span>
            {!compact && (
              <span className="font-serif italic text-label text-faint">
                {systemSubstrate.role}
              </span>
            )}
          </h3>
          <div className="mt-1.5 flex items-stretch gap-2 rounded-lg border border-dashed border-line p-2">
            {systemSubstrate.nodes.map((node, i) => (
              <Node key={node.id} node={node} index={n + i} flow="--c-flow-off" {...pass} />
            ))}
          </div>
        </section>
      </div>
    </Reveal>
  );
};

export default StackDiagram;
