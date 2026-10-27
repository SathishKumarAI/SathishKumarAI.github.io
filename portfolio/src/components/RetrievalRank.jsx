import { useEffect, useMemo, useRef, useState } from "react";
import { SHORTCUT } from "../utils/shortcut";
import { ask, corpusSize } from "../utils/answer";
import { projects } from "../constants";

/**
 * Owns, the one visualisation in the closing band: TF-IDF ranked retrieval run
 * live over this page's own passages, ending in links to the passages it found.
 *
 * Does not own: the retrieval itself. Every number, passage and destination on
 * screen comes from `utils/answer.js`, which is the same index the ask palette
 * queries. Nothing here is scripted, nothing is a stored result, and if a role
 * or a project is added to `constants` the ranking below changes in that same
 * edit. A canned animation of a search would have been easier and would have
 * been the one thing this site never does: a claim nobody can check.
 *
 * WHY THIS ALGORITHM
 *
 * The band it closes is about machines reading this page and about taking what
 * is useful from it. Ranked retrieval over the page's own text is literally
 * both: it is what a crawler does to this markup, and its output is a short
 * list of the things on the page worth reading next. It is also the only
 * candidate whose natural output IS a set of destinations — the brief's actual
 * requirement — rather than something decorative that then needs links bolted
 * underneath it.
 *
 * It is honest for free, too. `ask()` already exists, already returns verbatim
 * passages with the section they came from, and already refuses to answer
 * rather than guess. Re-implementing a toy of it here would have been a second
 * copy of the stop-word list and the stemmer, drifting from the first.
 *
 * WHAT WAS REJECTED, AND WHY
 *
 *  - Beam-search decoding as a pruned tree. The best story of the four, and
 *    unusable here: a tree is nodes joined by edges, which is `NeuralField`
 *    with different labels. Two node-and-edge graphs on one page read as one
 *    effect done twice.
 *  - BPE merge steps. Characters merging into sub-words is a row of little
 *    boxes changing over time — `TokenStream` already is a row of little
 *    boxes, four sections up, and it even uses real sub-word pieces.
 *  - An attention heat map over a sentence. Visually the most distinct of the
 *    four, and it fails the hard requirement: a matrix of weights ends in a
 *    matrix of weights. Any link under it would be an unrelated afterthought,
 *    and the sentence it attends over would have to be invented for the demo.
 *  - Cosine similarity over embeddings, the obvious modern answer. It needs
 *    vectors, and vectors mean either a model in the bundle or a table of
 *    numbers nobody can verify. TF-IDF is arithmetic a reader can check by
 *    counting words, which is the whole posture of this site.
 *
 * Visually it is a horizontal bar ranking: no nodes, no edges, no boxes on a
 * curve. Nothing else on the page looks like it.
 *
 * MOTION BUDGET: one pass.
 *
 * `PASS_BUDGET` in `netShape.js` is 2 because the hero field is a loop that has
 * to be seen twice to be legible. This is a sequence, not a loop: the bars grow
 * once, the citations land, and it is then STILL — about 1.3s start to finish.
 * It only moves again if the reader asks another question, which is a reader's
 * own action and not something performing at them while they read.
 *
 * Nothing is withheld while it runs. Every label, score, passage and link is in
 * the DOM from the first frame and only opacity and scaleX move, for the reason
 * `TokenText` gives: content is never gated behind decoration. The resting CSS
 * state is the FINISHED state, so a reader with no JS, no IntersectionObserver
 * or reduced motion gets the whole panel, correct, immediately.
 *
 * In flow, not absolute. The repo's rule that ambient work must never cross
 * text has been broken three times by absolutely-positioned canvases; a block
 * in normal flow cannot overlap anything by construction, and this effect has
 * no reason to float.
 *
 * Every width. The bars are 6px divs in a grid that stacks at `lg`, so there is
 * nothing to degrade below 1024px — unlike `TokenStream`, which is desktop-only
 * because a wave needs a run of pixels a phone does not have. A phone gets the
 * same three links.
 */

/**
 * Three questions, chosen because each one lands on a different part of the
 * page — a project, the stack, a role — so whichever the reader tries, the exit
 * is somewhere they have not been. The answers are not written here; these are
 * the only hardcoded strings in the file.
 *
 * The first is the hero's own claim about this site, pointed back at the site.
 */
const QUESTIONS = [
  "retrieval that cites the passage it used",
  "federated learning and privacy",
  "what runs offline without an account",
];

const SECTION_LABEL = {
  about: "About",
  roles: "Roles",
  stack: "Stack",
  projects: "Projects",
};

/**
 * A project card's anchor id IS its repo name (`id={name}` in `Works.jsx`), and
 * a projects passage is labelled with that same name, so the deep link needs no
 * separate id scheme. The set is checked rather than assumed: a label that is
 * not a card id would be a link to nowhere, and a dead anchor fails silently in
 * every browser.
 */
const CARD_IDS = new Set(projects.map((p) => p.name));
const hrefFor = (r) =>
  r.section === "projects" && CARD_IDS.has(r.label) ? `#${r.label}` : `#${r.section}`;

// Stagger, in ms, written as one table rather than scattered through the JSX.
// A row every 180ms is slow enough that the three land as three events; the
// parts inside a row are close enough that a row reads as one thing arriving.
const ROW_STEP = 180;
const AT_ROW = 120;
const AT_BAR = 90;
const AT_QUOTE = 200;
const AT_LINK = 320;

const canAnimate = () =>
  typeof window !== "undefined" &&
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const RetrievalRank = () => {
  const ref = useRef(null);
  const [query, setQuery] = useState(QUESTIONS[0]);
  // "rest" is the finished picture and the safe default. "arm" holds the parts
  // at zero; "go" plays them. Starting at "arm" in the same render that first
  // paints avoids the frame of finished-then-rewound you get from adding the
  // held state in an effect.
  const [phase, setPhase] = useState(() => (canAnimate() ? "arm" : "rest"));

  // `corpusSize` as the limit, not 3: the cut inside `ask` is a third of the
  // top score, so asking for everything is what reveals how many passages
  // actually cleared it. That count is the point of the caption.
  const scored = useMemo(() => ask(query, corpusSize), [query]);
  const hits = scored.slice(0, 3);
  const top = hits[0]?.score ?? 1;

  // Only run while it is on screen, and only once: this is a sequence that
  // finishes, so there is no loop to pause when the reader scrolls away.
  useEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate()) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setPhase("go");
        io.disconnect();
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pick = (q) => {
    setQuery(q);
    if (!canAnimate()) return;
    // Rewind, then play. Two frames because the browser only restarts an
    // animation it has seen removed, and one frame is not reliably a repaint.
    setPhase("arm");
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase("go")));
  };

  if (hits.length === 0) return null;

  return (
    <div ref={ref} data-phase={phase} className="rr mt-10 border-t border-line pt-8">
      <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <div>
          <p className="font-mono text-chip text-secondary">
            <span className="text-accent-ink">{"// "}</span>
            what this page returns when it is searched
          </p>
          <p className="mt-3 font-sans text-secondary text-body leading-[1.65]">
            {/* The shortcut is the reader's own platform's, from utils/shortcut.js.
                This line printed "⌘K" to every visitor while the navbar, six inches
                away on the same screen, correctly printed "Ctrl K" on Windows. */}
            The same index the {SHORTCUT} palette uses, run here in your browser.
            Pick a question and it ranks every passage on the page, then quotes
            the best one and links to where it lives.
          </p>

          <ul className="mt-5 flex flex-col gap-2 list-none">
            {QUESTIONS.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => pick(q)}
                  aria-pressed={q === query}
                  className={`w-full text-left font-mono text-chip leading-[1.5] px-3 py-2 min-h-11 sm:min-h-0 rounded border transition-colors ${
                    q === query
                      ? "border-accent-ink/60 text-accent-ink bg-accent/5"
                      : "border-line text-secondary hover:border-accent-ink/40 hover:text-white-100"
                  }`}
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-4 font-mono text-micro text-faint leading-[1.6]">
            {corpusSize} passages indexed · {scored.length} above the cut · top{" "}
            {hits.length} cited
            <br />
            TF-IDF, stop-words dropped, stemmed, length-normalised
          </p>
        </div>

        {/* aria-live, because changing the question rewrites this list in place
            and a reader who cannot see the bars move gets no other signal. */}
        <ol aria-live="polite" className="flex flex-col gap-5 list-none">
          {hits.map((r, i) => {
            const at = AT_ROW + i * ROW_STEP;
            const where = SECTION_LABEL[r.section] ?? r.section;
            const href = hrefFor(r);
            // Name the card only when the link actually lands on it. Saying
            // "Roles / AdvanSoft" above a link that stops at the top of Roles
            // promises a precision the anchor does not have.
            const card = href === `#${r.section}` ? "" : ` / ${r.label}`;
            return (
              <li key={`${r.section}-${r.label}`} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
                <a href={href} className="group block">
                  <div className="rr-fx flex items-baseline gap-3" style={{ "--rr-at": at }}>
                    <span className="font-mono text-micro text-faint tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-sans text-data text-white-100 transition-colors group-hover:text-accent-ink group-hover:underline underline-offset-4">
                      {r.label}
                    </span>
                    {/* RANKED AGAINST THE BEST MATCH, and the top row says so
                        in words rather than printing a number.

                        This has now been wrong twice. First it printed the raw
                        TF-IDF score (`3.36`), which has no units and no scale,
                        so the only thing a reader could extract was an ordering
                        the bar already showed. Then it printed a share of the
                        top score, and the owner asked what `100%` meant — which
                        is the whole problem: a percentage reads as ABSOLUTE.
                        `100%` looks like "perfect match" or "fully confident",
                        when all it ever meant was "this one scored highest",
                        and it said so on every result because the top row is
                        100% by construction. A figure that cannot vary carries
                        no information and still invites a false reading.

                        So the best match is labelled, not scored, and the rows
                        under it are given relative to it — "61% as strong" is a
                        claim about this list, which is the only claim the maths
                        supports. The raw score stays in the title for anyone
                        who wants it. */}
                    <span
                      className="ml-auto shrink-0 font-mono text-micro text-faint tabular-nums"
                      title={`TF-IDF score ${r.score.toFixed(2)}`}
                    >
                      {i === 0
                        ? "best match"
                        : `${top > 0 ? Math.round((r.score / top) * 100) : 0}% as strong`}
                    </span>
                  </div>

                  {/* The bar is the score as a fraction of the top score. The
                      tick at a third marks `ask`'s own cutoff, which is why 19
                      passages became the handful in the caption. */}
                  <div className="rr-track mt-2">
                    <div
                      className="rr-bar group-hover:opacity-100"
                      style={{
                        width: `${Math.max(2, top > 0 ? (r.score / top) * 100 : 0)}%`,
                        "--rr-at": at + AT_BAR,
                      }}
                    />
                    <span className="rr-cut" />
                  </div>

                  <p
                    className="rr-fx mt-2.5 font-serif text-body leading-[1.6] text-secondary"
                    style={{ "--rr-at": at + AT_QUOTE }}
                  >
                    “{r.passage}”
                  </p>

                  <p
                    className="rr-fx mt-1.5 font-mono text-micro text-accent-ink"
                    style={{ "--rr-at": at + AT_LINK }}
                  >
                    {where}
                    {card}{" "}
                    <span className="inline-block transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </p>
                </a>
              </li>
            );
          })}
          <li className="font-mono text-micro text-faint leading-[1.6]">
            Results are ranked against each other, not scored out of ten:
            &ldquo;61% as strong&rdquo; means relative to the best match on
            this question. The tick is the cut at a third of it — anything
            under that is noise sitting below a real answer, so it is not
            shown.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default RetrievalRank;
