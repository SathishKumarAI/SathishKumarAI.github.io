# STATUS: personal-portfolio

Written when work stopped. Read this first on return, then `portfolio/README.md`
for the change-to-file table.

**Last touched:** 2026-10-27
**Branch:** `main`. **88 PRs squash-merged** (#1 was closed unmerged), every branch deleted, nothing open.
**Working tree:** clean.

**Live:** <https://sathishkumarai.github.io/> — GitHub Pages, built by
`.github/workflows/deploy.yml` **in this repo**. A merge that touches
`portfolio/` deploys it. To re-run without a code change:

```
gh workflow run deploy.yml
```

Three things that have each caught someone out:

- The CDN serves the previous bundle for 15-60s after a successful run. Do not
  trust the green tick; check the live page.
- **DO NOT VERIFY A DEPLOY BY COMPARING THE LIVE BUNDLE HASH TO A LOCAL BUILD
  ON THIS MACHINE. It can never match.** Git stores this repo LF and checks it
  out CRLF on Windows — `git ls-files --eol` reports `i/lf w/crlf`, and there
  is no `.gitattributes`. Source newlines that reach a chunk therefore differ
  by a byte each, `NeuralField3D` hashes differently, and because the entry
  bundle embeds a map of chunk filenames its hash changes too.

  Measured 2026-10-17: CI built `index-B1rDkshV.js` and the same commit built
  `index-C47QvJ4P.js` here. The only difference in 152,428 bytes was the chunk
  name at byte 80. A poll that waits for the hashes to agree will spin until it
  times out and report a failure that did not happen.

  Verify this way instead:

  ```bash
  gh run list --workflow deploy.yml --limit 1 --json headSha,conclusion
  # headSha must equal `git rev-parse HEAD`, conclusion must be success
  curl -s https://sathishkumarai.github.io/ | grep -o 'index-[A-Za-z0-9_-]*\.js'
  # fetch that bundle, grep it for something the change actually added
  ```

  Making the hashes agree needs `.gitattributes` with `* text=auto eol=lf`,
  which renormalises every file in the working tree. A real fix and a noisy
  one; not done.
- **The repo name is load-bearing.** Only `<user>.github.io` is served from the
  domain root. Rename this repo and Pages moves the site to a subpath, breaking
  every absolute URL unless Vite's `base` changes with it.

**The site is `portfolio/`.** Everything else is supporting material.

## The 2026-10-27 session: an audit, and seven PRs against it

Seven PRs (#83-#89). A full design critique of the site ran first, then its
findings were worked through in order. **The audit's own score was 30/40 (75%,
"Good")**, and the snapshot is at
`.impeccable/critique/2026-10-27T00-34-39Z__portfolio-src-app-tsx.md` -
gitignored, local only.

| PR | What | The number |
| --- | --- | --- |
| #83 | The hero's emoji cursor removed | 65 lines deleted; `dist/` grep clean |
| #84 | Live demos per project filed as a ticket | 5 of 6 projects are `live_link: null` |
| #85 | A scroll-down button, left edge, mirroring back-to-top | walked the page in 7 clicks |
| #86 | The tool count derived; the shortcut label centralised | "47 tools" -> 56; `CMD-K` -> `Ctrl K` on Windows |
| #87 | Contrast: stage numerals, field labels, Slate's `--c-faint` | 17 failures -> 0 across 48 elements, 3 themes |
| #88 | Stack opens on the system diagram | 17 nodes of 1-9 instead of 6 groups of 5-13 |
| #89 | Thin links given a 44px target on phones | 11 undersized -> 3 at 390px |

### What the audit found that mattered most

The site's evidence layer is unmistakably this person's - a network drawing wired
to the live rects of the two rails, a schematic per role derived from that role's
own bullets, a TF-IDF retrieval running in the browser over the page's own
passages. The scaffolding around it is the generic developer-portfolio template.
**That is the inverse of what a cinematic direction needs**, and the hero is where
it is most interchangeable.

Two things turned out to be already built and merely hidden: the 17-node stack
taxonomy (#88 fixed that on desktop) and 1,037 lines of three.js that is
effectively invisible in the default light theme (not fixed; see below).

### Traps found, each the hard way

- **A threshold you pick out of the air is a bug waiting.** The scroll-down button
  first used a hand-chosen 32px slack for "is this section still ahead of me".
  `.hash-span` carries `scroll-margin-top: 5.5rem`, so after a jump the anchor
  rests at exactly **88px** - above a 32px line. The section you had just arrived
  at stayed "next" forever: one click reached Roles and every click after did
  nothing. It now reads the anchor's own computed `scroll-margin-top`.
- **A comment can be the stale half, not the colour.** Slate's `--c-faint` was
  commented "4.89:1 on card". Measured against the role card's real fill of
  `rgb(34,57,63)` it was **4.07:1**. The card had been relit separately and
  nothing re-measured the text on it.
- **Not every stale number is wrong.** "It replaced thirty-three floating
  popovers" and "twelve of thirty-three tools were the heaviest marks" are
  measurements of rejected designs, taken when the set really was 33. Only
  present-tense claims were corrected; past-tense ones were left, because
  updating them would turn a true record into a false one.
- **Two reported clipping bugs were false positives.** The About availability card
  reports `scrollWidth` 465 against `clientWidth` 333, but no descendant exceeds
  the card's width and its text reads out complete - the excess is a decorative
  pseudo-element a DOM walk cannot see. The footer `dd` reports 25px of overrun
  while the document does not overflow at all (380 against 390). Nothing was
  changed for either.
- **Smooth scroll makes measurement lie.** `<html>` has `scroll-behavior: smooth`
  and this page is 9,908px, so a programmatic `scrollTo` can still be in flight
  after 2.5s. Three "bugs" in the scroll-down button were nothing but reads taken
  mid-animation; a 3s settle showed correct behaviour. Set
  `documentElement.style.scrollBehavior = 'auto'` before measuring scroll state.
- **The detector's JSX path finds nothing.** `impeccable detect --json src` exits 0
  on this codebase - and also exits 0 on a deliberately broken control `.jsx` with
  10px text and `#777` on `#888`. It is regex-only off HTML. Use its browser
  rendering mode (`detect <url>`) instead; that found 20 primary + 18 advisory.
- **An offscreen iframe never fires `whileInView`.** Mounting the app at
  `left:-99999px` to test narrow widths works for "which view mounted" and lies
  about "what is visible", because nothing ever intersects a viewport.

### Unfinished, and why - read this before picking anything up

- **Act 1, the cinematic landing page.** The direction was agreed: Act 1 pure
  atmosphere claiming nothing, everything after it staged measurement, and
  `data-scheme="dark"` forced for Act 1's own 100svh only - so the three.js field
  becomes visible to a cold-landing reader *without* overruling the documented
  Paper default for the document below. **Blocked, genuinely:** Impeccable's
  context loader returns `BUILD_INIT_REQUIRED` because there is no `PRODUCT.md`,
  and a new surface needs that captured with the owner first. It is also already
  in this file's backlog as "(P1, M) Campaign act 4: scroll choreography".
- **The planes on a phone** - `COD-405`. #88 defaulted the Stack to the 17-node
  reading only from `lg`, because `StackDiagram` is `hidden lg:block`. Desktop and
  phone therefore now show two different primary taxonomies of the same 56 tools.
  Needs a design decision about how 3 planes, a substrate and 17 nodes read at
  390px, not a port: the desktop version's payload arrows run horizontally, which
  is the one direction a phone does not have.
- **Contrast behind the glass** - `COD-406`. #87 fixed everything sitting on an
  opaque ground. What is left cannot currently be measured: an ancestor-walk put a
  hero clock at 4.93:1 and the bundled detector put the same element at 1.4:1,
  and neither sees the composited result of `backdrop-filter` over scrolling
  content. Wants pixel sampling from a real capture, not `getComputedStyle`.
- **TokenStream** - `COD-407`. Deliberately not changed. It crosses exactly one
  text element, the "Stack" heading, which `src/components/README.md` records as
  the authored intent - and its "broken" fragments are real subword tokens, which
  is the concept. The problem is that a reader who does not know what a tokenizer
  emits reads it as a rendering fault. Three options are in the ticket; it is the
  owner's call.
- **The persistent contact bar.** Still unbuilt and deliberately left: this file's
  own backlog says to do it *after* act 4 "so it does not fight the scene
  transitions", and act 4 is the blocked item above. Sequencing respected rather
  than overridden.

### Next action

1. Run `/impeccable init` to capture `PRODUCT.md`. It is the one thing blocking
   the landing page, and it needs the owner's words rather than a guess.
2. Then Act 1, per the direction above.
3. `COD-405` and `COD-406` are independent of both and can go in any order.

## The 2026-10-16 session: layout, docs, and one self-inflicted outage

Seven PRs (#71-#77). The repository was reorganised; the site changed only in
its footer.

| PR | What | The number |
| --- | --- | --- |
| #71 | Colophon grouped into four labelled categories | footer 97px -> 128px |
| #72 | The component map, which had drifted behind the code | 6 stale facts, 4 missing pointers |
| #73 | Root orientation: two doc sets explained, `Research_Docs` given a README | — |
| #74 | **`3d_portfolio` -> `portfolio`**, 6.0 MB of template assets archived | 130 files renamed with history |
| #75 | Prompts, a writing standard, a navigable README, two file splits | `constants` 885 -> 30-line barrel + 9 files |
| #76 | **Fixing the outage #74 and #75 caused together** | main could not build |
| #77 | This file, which described a branch that merged a day earlier | 2 contradictory bundle hashes in one header |

### The layout now

```
portfolio/      the site. Everything buildable.
docs/           ONE documentation tree
  site/         how the site works and why          (10 files)
  repo/         the GitHub account around it         (2 files)
  prompts/      building one of these with an agent  (3 files)
  notes/        personal notes, unmaintained         (was Research_Docs/)
  STYLE.md      how these documents are written
archive/        kept, not deleted. Nothing references it
  template-assets/  6.0 MB of forked-template imagery
  orphans/          a root lockfile, two dead exports
README · LICENSE · CLAUDE.md · STATUS.md   the only files at the root
```

`CLAUDE.md` and `STATUS.md` stay at the root deliberately: Claude Code reads
the first only there, and the workspace convention expects the second at every
repo root.

### The outage, and why nothing caught it

**Read this before renaming anything in this repository.**

`.gitignore` carried `portfolio/`, added 2026-09-11 to ignore an abandoned
Next.js attempt. The rename in #74 collided with it.

Nothing appeared to break. **Git does not untrack files that are already
tracked**, so the rename committed cleanly, the build passed, CI was green.
The rule only affected files created AFTER the rename — and #75 created
eleven of them. What reached `main` was a barrel importing nine files that
were not there.

Two failures, both avoidable:

1. The split was verified with build, tests, lint and an export-parity check.
   All four passed, **because they ran against the working tree, where the
   files existed.** Nothing inspected what git had STAGED. `git status` would
   have shown eleven `??` lines.
2. CI caught it and the PR was merged anyway: the wait loop polled until the
   run reported `completed` and never read `conclusion`, which said
   `failure`.

**After any `git mv` of a directory, run `git check-ignore -v <newpath>/<a
new file>`.** It is one command and it is the only thing that would have
caught this before CI.

### Open, and all of it is the owner's call

1. **Nine tools are live but unverified as his experience** — `Snowflake`,
   `Databricks`, `Unity Catalog`, `Guardrails`, `LangSmith`, `Ragas`,
   `IAM & RBAC`, `Secrets management`, `PII & anonymisation`. Remove any that
   are not true from `stackGroups` and `npm test` names what else must move.
   Reasoning for every placement: `docs/site/STACK-TAXONOMY.md`.
2. **Coding assistants have no home.** A fourth category — tools that write
   the code, not components of what it runs. Named nowhere. If they should
   appear they need their own block, never the stack.
3. **Four files remain over the 500-line ceiling**: `NeuralField3D.js`
   (1037), `Tech.jsx` (546), `StackDiagram.jsx` (516), `CodeCompletion.jsx`
   (515). Each is one concern that happens to be long. The hero field is the
   most bug-prone file here; splitting it needs a better reason than a count.
4. ~~**Two repos, and they could be one.**~~ Done 2026-10-16. See below.

## The 2026-10-15 session, newest first

Fourteen merges, #50 to #63. `docs/site/WORKLOG.md` has the
measurements; `DECISIONS.md` has what was chosen and what it cost.

| PR | What changed | The number that mattered |
| --- | --- | --- |
| #63 | About's stream waits for the section to finish arriving, and slowed | gate opens **250ms** after the scroll stops; 23 words over **1.93s** |
| #62 | The stream holds until the reader actually stops scrolling | gate stayed `wait` through a stepped scroll past the section |
| #61 | Two overlaps cleared, the CTA calmed, About's claims stream | SCROLL vs OUTPUT **53x33px** → 0; CTA **18.2:1** |
| #60 | The dead space above the status row closed; the row earns it | navbar to status row **52px → 20px** |
| #59 | The field stops performing; the hero claims stream | 2 passes then still; first word **796ms** |
| #58 | The field became a dense layer | **34 → 110 edges**, alpha 0.26 → 0.095 |
| #57 | Every hidden unit wired; light themes made readable | incoming `0,1,...` → **all 1**; sepia **11.5 → 32.5** |
| #55 | Canvas sized in CSS px; field made visible and stopped painting over the page | canvas box **2401x1324 → 1601x883** |
| #54 | The field animates a forward pass, not a path through one | `IN x4` → `OUT x5`, pass **3453ms** |
| #53 | Roles deck got a drawn seam and a card the dark can show | covered inset **4.0 → 8.1px** |
| #52 | Hidden columns land on their labels; the field stays wired | label-to-node **50px → 0.8px**; re-anchors in **2 frames** |
| #51 | The field stands down below the rail breakpoint | orphan labels at 882px **4 → 0** |
| #50 | The gutter moved to the stage, out of the 1280px cap | hero `h1` at 1920px **392 → 320px** |

### The trap that cost this session the most

Three hero-field bugs were stacked and each hid the next: a canvas sized in
drawing-buffer pixels, mounted so it painted over the page, at an alpha low
enough that nobody could see either. All three were pixel-perfect or invisible
at DPR 1, which is why they shipped.

**And every measurement agreed with the bug.** Buffer-to-CSS conversions used
`canvas.width / innerWidth`, which IS the device pixel ratio and therefore
exactly the magnification being hunted — dividing by it cancelled the error and
every check came back green. Convert through `canvas.getBoundingClientRect()`
instead: that box cannot cancel the thing it is being used to measure.

The screenshots were right and were overruled three times because the
arithmetic looked cleaner. **When a measurement and the picture disagree, the
measurement is the one with a bug in it until proven otherwise.**

### Open, and worth knowing before touching the hero

- **`COD-327`: cold-loading any section link does not scroll.** Measured on
  `/#roles`: `scrollY` 0 with the anchor 1742px down. The browser resolves the
  hash before React has rendered anything to scroll to. In-page clicks work; a
  shared or bookmarked link does not. Filed, not fixed.
- **The parallax still swings the two anchored layers 17.1px** across a pointer
  sweep, against −3.8/5.2 for the free ones. Kept on the owner's call after
  being shown the numbers. `PARALLAX` in `NeuralField3D.js` is the knob: set
  both axes to 0 for pixel-exact anchors.
- **three.js is 133.1 kB gzipped** for depth plus parallax. The owner asked to
  decide after seeing it run correctly; it now does, so the question is live.
- **`sepia` is the weakest theme** for field contrast at 32.5 resting against
  34.6 on dark. Deliberately soft palette; it is the floor, not a bug.

## Stack (merged; was `feat/stack-one-screen`)

Five commits. The section holds **one screen in both of its views**, which is
the constraint every decision below was traded against.

| Commit | What changed | The number that mattered |
| --- | --- | --- |
| `c5c5cdd` | Stack condensed to a single screen | 1166px → 852px |
| `5d89e03` | The six reported faults reassessed and measured | token band overlap **416x106 → 0**; ink stopped decaying to 0.00 |
| `dbc8cfd` | DynamoDB, S3 and Pinecone given marks | terms with a glyph **30/33 → 33/33** |
| `1fa491d` | Twelve current tools added across five areas | **33 → 47 tools**, section held at **1.00 screens** |
| `180076f` | The same stack offered as a system diagram | list **881px**, diagram **841px** |
| `8aa364f` | The closing band ranks the page's own passages | bars settle 100 / 50.6 / 40%, plays once |
| `6a6274d` | Diagram redrawn by RESPONSIBILITY, and made portable | list **881px** / diagram **997px** |
| `2f430d7` | Flow payloads stopped looking like tool names | payload accent/uppercase/1.92px vs tool near-black/normal |
| `ca36f3c` | The crawler notice became points, as its docstring already claimed | 6 items, 15 points, 6 real nested lists |
| `1140d11`, `8f837b6` | The retrieval figure, wrong twice, finally ranked not scored | `3.62` → `100%` → **"best match" / "51% as strong"** |
| `52a3343` | The hole beside the heading closed; controls seated together | **710x127px** void filled; list back to 881px |
| `42734ea` | Diagram layered into planes; colour became a measurement | 5 stages → **16 nodes**; luminance monotonic in 6 themes |

**The one-screen rule holds for the list only, and that is stated rather than
hidden.** Measured at 1707x872: tool list **881px (1.00 screens)**; diagram
**1207px (1.38)** with sixteen nodes. Everything that pushed it over was
content added on request — role lines, labelled edges, the swap table, the
`?` explainer, then the finer layering. The optional layers render only when a
reader asks for them. Levers left, both the owner's call: collapse the
substrate band, or drop the per-node role line (~40px), which is the sentence
that makes a box a slot rather than a label.

### The closing band now does something

`RetrievalRank` runs **TF-IDF ranked retrieval over the page's own passages**,
reusing `utils/answer.js` — the index the Ctrl-K palette already uses, so
adding a project changes the ranking with no second list to maintain. Pick a
question, it scores every passage, quotes the best three verbatim and links to
where they live. It plays once and stops; the observer disconnects after the
first hit.

**Its figure was wrong twice, in opposite directions, and that is the lesson.**
The raw TF-IDF score (`3.62`) was measured and useless — no units, no scale. A
share of the top score was legible and misleading: a percentage reads as
ABSOLUTE, so `100%` looked like "perfect match" when it only ever meant "this
scored highest", and it said so on every result because the top row is 100% by
construction. It now reads **"best match"** and **"51% as strong"** — a claim
about the list, which is the only claim ranked retrieval supports. A figure
being measured is not enough; it also has to be one a reader can act on.

### The Stack section, as it now stands

| | |
|---|---|
| Tools | **56**, each with a definition and a mark |
| Views | tool list (default) · system diagram, with a `less detail` mode |
| Diagram | 3 planes + a substrate, 17 nodes, labelled payloads between planes |
| Cloud matrix | **38 roles** mapped to AWS, Google Cloud and Azure |
| Honesty rail | `mine` is the only column that is a claim about him; 10 rows carry an em dash |
| Reasoning | `docs/site/STACK-TAXONOMY.md` — every tool, the box it is in, and why |

**The correction worth remembering:** `Claude` sat in the `Inference` box with
`vLLM` and `Ollama`. Those are an inference *server*, a local *runtime* and a
*hosted model* — three different kinds of thing, and a reader who deploys LLMs
would have stopped trusting the page there. The Model plane now has a
`Hosted models` box. Placement is a claim; `STACK-TAXONOMY.md` exists so the
next one can be checked rather than guessed.

### The colour scale, and why the rainbow was wrong

Reported as "AI slop", and the diagnosis is worth keeping: **the data is
ordinal and the palette was categorical.** Six distinct hues say "six
unrelated kinds"; these are positions on one path. Hue carries no inherent
ranking — nobody can say whether olive precedes teal without a legend — so the
one thing colour had to encode was the one thing it could not. The sweep also
passed through a muddy yellow-olive midpoint, the `jet`-colormap failure.

It is now **one hue at six intensities with strictly monotonic luminance**,
which is the part that makes it a scale rather than six tints. The first
attempt was NOT monotonic (step 2 at 0.254 against step 3 at 0.261 — chroma
rose while lightness stayed flat) and that was caught by measuring, not by
looking. Measured across all six themes: rising 0.151→0.281 on dark grounds,
falling 0.284→0.092 on light, every step clearing 3:1 against its own ground.

Meaning, in the page's own terms: **temperature.** Raw data arrives cold and
undifferentiated, each plane commits to more, and what ships lands on the
accent. The substrate is off the scale entirely, in neutral, because it is not
a position on the path.

### The diagram, after the interview reframing

The owner's framing was "answer this like a Google interview". That killed the
first diagram: its boxes were `stackGroups` entries — Data engineering, Data
science, Computer vision — which are categories of a PERSON. Nobody draws a
box called "Data engineering" on a whiteboard.

The boxes are now the **jobs the system has to do**, and the tools are what
drops into each slot. That is what makes the useful sentence available:
*"Airflow orchestrates here; on GCP that is Composer, on AWS that is MWAA —
same role."*

| Decision | Why, and what it cost |
| --- | --- |
| Stages = responsibilities | The only thing that makes this a second READING rather than a second filing |
| Labelled flow payloads | A bare arrow repeats the 01-06 numerals; `features` says what the next stage RECEIVES |
| Payloads styled as capsules | They were faint lowercase mono beside faint lowercase mono tool names and read as three more skills |
| Vision ‖ Language share a row | The one claim the six-column list structurally cannot make |
| `Ship & observe` is the floor | Nothing flows into it or out of it, so it gets no step above it |
| Full-width bands, not columns | Five boxes at ~200px wrapped 47 tools raggedly — reported as "the skills are scattered" |
| Three planes + a substrate, 16 nodes | A single chain cannot say that part of an ML system is a FLOW and part is a SUBSTRATE. Docker and Python sit nowhere in the order; everything stands on them |
| Model plane marked `alternatives` | Detection and retrieval are not sequential, and most projects use one or two. A connector would claim a dependency that is not there |
| Vision split: detect vs federated | Different problems with different constraints — one is a model on a frame, the other a topology where data may not move |
| `platformSwaps` never REPLACES a name | Overwriting "S3" with "Cloud Storage" would claim he runs GCP. Absent beats invented |
| Build tooling named nowhere | How a thing was built and what it is made of are two different lists |

### What the Stack section is now

- **Two views over one dataset.** `Tech.jsx` owns the tool list and the toggle;
  `StackDiagram.jsx` owns the system reading. Both map `stackGroups` and both
  call the same `setHovered`/`pinTerm`, so a term is defined once and a pin
  survives a view switch. The toggle is `lg` and up; a phone gets the list.
- **The diagram asserts one thing the list cannot:** LLM / RAG and Computer
  vision are PARALLEL, not stages three and four of six. MLOps is the floor
  under all of them, not a fifth stage — nothing flows into it or out of it.
- **Its connectors are layout, not a measured overlay.** Flex siblings cannot
  drift from the boxes they sit between, which is the failure mode the hero
  field has.
- **47 tools, every one with a glyph and a plain-English definition.** 37 brand
  marks are generated from simple-icons; the rest are drawn in
  `conceptIcons.js`, including S3, DynamoDB and Pinecone, which have no
  upstream mark and are therefore drawn as what they ARE rather than as a
  recalled logo.

### What was cut to make room, and why

Each of these was a REPETITION, not a sacrifice — the budget just forced
someone to notice:

- The hint line "Dotted terms have a plain-English definition, tap one" was the
  same instruction the definition panel was already giving, 400px away, both
  desktop-only. `TERM_HINT` moved into the panel. **−29px.**
- The path rule "FROM RAW DATA — TO A RUNNING PRODUCT" was the fourth statement
  of one fact: the columns run left to right, are numbered 01-06, each carry a
  tint bar, and the intro paragraph three lines above says those exact words.
  **−41px.**
- The diagram's two termini said it a fifth time, and cost ~200px of the row's
  WIDTH — which is what the nodes needed in order to wrap in fewer lines.
  Row **314px → 231px.**

### Three traps this branch added to the directory README

- **A `<canvas>` is a replaced element: `left` + `right` does not stretch it.**
  `TokenStream` measured 416px against the ~1060px its insets implied.
- **A bare `/* */` in JSX children renders as text.** One dropped `{}` added
  120px of invisible space; build and eslint both passed.
- **The token band's clearance is not constant across breakpoints.** The
  toggle's question wraps below 1536px and lifts it from y=178 to y=161, so the
  band height is responsive.

### Fixed in passing, and it was on `main`

`portfolio/src/components/README.md` had **two committed merge-conflict
blocks** (`<<<<<<< HEAD` / `>>>>>>> b41aa04`) sitting in the change-to-file
table and the traps list. Both sides were complementary rather than competing —
the palette and 2D field rows against the 3D field rows, the role-deck traps
against the three.js traps — so both were kept. Repo-wide scan: that was the
only file affected.

### Open decisions — these are the owner's, and the work is blocked on neither

1. **Nine tools are unverified claims about his experience.** Added on request
   in the 2026-10-15 session and shipped: `Snowflake`, `Databricks`,
   `Unity Catalog`, `Guardrails`, `LangSmith`, `Ragas`, `IAM & RBAC`,
   `Secrets management`, `PII & anonymisation`. If any is not true, delete it
   from `stackGroups` in `src/constants/index.js` and `npm test` will name
   everything else that has to move. See `docs/STACK-TAXONOMY.md`.
2. **Coding assistants have no home and are named nowhere.** Claude Code,
   Copilot and Cursor are a fourth category — tools that WRITE the code rather
   than components of what it runs. They must not be mixed into the stack; if
   they should appear at all they need their own block. Not decided.
3. **The list view is 1.08 screens, not 1.00.** It was 0.99 before the
   definition card was flattened into a strip. The trade bought a definition
   line beside its tools and an animation four times the area. Reverting is a
   revert, not a rebuild.

### Where the next session starts

Stack is merged and live, with 56 tools and a 38-role cloud matrix.

- The diagram has a **`less detail`** control, which is the answer to its
  height rather than cutting the lines that make a box a slot. It was called
  `fit to screen` until 2026-10-16, when measuring showed it fits one screen
  size and no other. Section height as a multiple of the viewport, measured
  in headless Chrome against `vite preview`:

  | | tool list | diagram | `less detail` |
  |---|---|---|---|
  | 1920x1080 | 0.81 | 1.16 | **0.93** |
  | 1440x900 | **0.99** | 1.52 | 1.22 |
  | 1366x768 | 1.16 | 1.77 | 1.42 |

  **One slide on a laptop needs pagination, not a smaller label.** The four
  planes are 169px each and the smallest type in the view is already 10px, so
  a scale-to-fit transform would reach 0.67 at 1366x768 and render that type
  at 6.7px. Splitting the four planes across two slides is the only route
  that fits with the type intact, and it costs the thing the diagram is for:
  seeing all four layers at once.
- `COD-327` — cold-loading a section link does not scroll. Still open.
- The **emoji cursor is live on the hero only**, and nowhere else. Links and
  buttons keep their pointer. To remove: delete the `.hero-cursor` block in
  `index.css` and the class in `Hero.jsx`.

## The 2026-09-15 session, newest first

Nine merges, #39 to #47. Read `docs/WORKLOG.md` for the measurements behind each.

| PR | What changed | The number that mattered |
| --- | --- | --- |
| #47 | Every document brought up to date; the availability card stopped repeating the hero pill | 15/15 links open in a new tab; two dead style tokens deleted |
| #46 | About stopped reprinting each project's description; per-project anchors; one glossary entry for two federated chips | three sentences were on the page twice |
| #45 | A phone draws three project cards and offers the rest | 9,825px → 8,091px, **9.6 screens** |
| #44 | Five `<section>`s got accessible names; Stack headings lost a stray `01`; degrees nest under Education | Lighthouse was already 100 — none of it was visible there |
| #43 | The hero field slowed so it stops competing with the headline | ~9.6 lit dots → ~4.9 |
| #42 | Every scene given clearance from the fixed docks | text no longer ran under the left rail |
| #41 | The spec band removed, on the owner's call | it restated figures the eyebrows already carry |
| #40 | Stale social card regenerated; the JSON-LD and `<noscript>` mirrors guarded; fonts trimmed | 20 woff2 files → 12 |
| #39 | The documentation set, and plain-English comments on the hard files | `ARCHITECTURE`, `DECISIONS`, `LEARNING-NOTES`, `manifest` |

**Two things to know before editing.**

1. **A phone hides projects 4–6.** `PHONE_CARDS` in `Works.jsx` and the
   `.projects-grid[data-collapsed]` rule in `index.css` are ONE mechanism, and a
   deep link to a hidden card has to open the deck first. If you add a link to a
   project from anywhere new, link to `#<project name>`, not `#projects`.
2. **Section names for screen readers come from the `<h2>` itself.** Rename a
   section and the accessible name follows; type the name a second time anywhere
   and you have created the drift this avoided.

## Where it stopped

Eighteen merges in one session. The through-line, after the owner asked for it:
**the page is staged as a campaign — BMW rather than Sprite or Google** — with
copy cut to campaign length. Two acts of that are built; three are not.

### What a reader meets now, in order

| | What it does | Where |
| --- | --- | --- |
| **Hero** | `From model development to real-world impact.` and three claims on accent rules, not a 38-word paragraph | `Hero.jsx` |
| **Hero field** | real 3D: input layer on the contact dock, output on the section rail, hidden layers pushed forward and back. The pointer moves the camera | `NeuralField3D.js` |
| **Clock** | his three zones plus the reader's own, and the hours between them, read from the device | `LiveClock.jsx`, `utils/localzone.js` |
| **`Ctrl K`** | an ask box. Retrieves passages from the page's own `constants` and cites the section they live in | `CommandPalette.jsx`, `utils/answer.js` |
| **Scenes** | every other section paints a full-bleed ground with hairline edges; heads at 76px | `SectionWrapper.jsx`, `main > section:nth-of-type(even)` in `index.css` — `even` since the spec band was deleted |
| **About** | three claims, each naming the project that proves it and linking to that card. It no longer reprints the project's own sentence | `About.jsx` |
| **Roles** | a sticky deck; only the card being read is lit, the covered ones dim | `Experience.jsx` |
| **Stack** | 56 tools in six areas, readable as a list or as a system diagram; the diagram re-renders on AWS, GCP or Azure across 38 roles. 38 brand logos, the rest drawn | `Tech.jsx`, `StackDiagram.jsx`, `toolIcons.js`, `conceptIcons.js` |

### Names, because two sections had two each

The nav said **About** over a section headed *Overview*, and **Work** over one
headed *Projects* — and "Work" also collided with "Experience". Every nav label
now equals its section heading:

    About · Roles · Stack · Projects · Contact

`Experience` became **Roles** (what they are, and what the eyebrow counts);
`#work` became `#projects`. Zero dangling anchors on the page.

### Paper is the default palette

For a first-time reader, whatever the device prefers. That overrules
`prefers-color-scheme` deliberately: the reader who lands cold is usually a
recruiter on a work laptop in daylight. Dark is one click and is remembered.

### The traps this session set, all worth carrying

1. **One `overflow-x: hidden` on a wrapper above the roles** turns the deck back
   into a flat list, silently. `html`/`body` are the exception — their overflow
   propagates to the viewport, which is why the deck works over the `body` rule
   already in `index.css`.
2. **three.js must stay unnamed in `manualChunks`**, or 131kB gzipped lands in
   the entry graph. And **import it by name, never as a namespace**: the
   namespace form defeats tree-shaking, 191.81kB against 131.13kB.
3. **A canvas keeps its first context for life.** `NeuralField` must not take a
   2D context until it knows it is drawing, and the 3D module makes its own
   element, because `forceContextLoss()` poisons one for the next renderer.
4. **Never parse SVG path data with a regex.** Rounding coordinates destroyed
   every mark using compact arc syntax — `01.5` is two arc flags and a number,
   and Docker, MLflow and Kubernetes rendered blank while the build stayed green.
5. **Dim a card's children, never the card.** `opacity` on `.role-card` makes
   its ground translucent and two covered cards show each other's text.
6. **Read every rect before writing any attribute.** The covered-card handler
   interleaved them and forced a synchronous layout per card per frame: 50ms
   worst frame against 33.6ms batched.
7. **The Stack colours are a ramp now, so order matters more than the values.**
   Reorder `stackGroups` without reordering them and it climbs then jumps back.
8. **A comment that quotes copy goes stale when the copy does** — changing the
   headline invalidated two component headers that justified themselves by
   quoting it.

### Checks that did not exist this morning

`npm test` is **42 checks across six files**, and CI runs it between lint and
build:

- `utils/answer.test.mjs` — the retrieval behind the ask box, including that
  every passage is quoted rather than written, and that every cited section is a
  real nav id.
- `utils/localzone.test.mjs` — the timezone maths, including that India to US
  Central is +11:30h in January and +10:30h in July.
- `utils/llms-mirror.test.mjs` — **every employer, role, project, school, stack
  group, primary tool and the email in `constants` must appear in `llms.txt`.**
  Proved to fail against a copy with the Roles section deleted, which is the
  regression that shipped: the crawler copy had listed no jobs at all, ever.

### The earlier history, kept because the reasoning still applies

Everything below this line predates today's session. The decisions it records —
why the capability cards went, why the hero band measures its own slack, why the
mobile menu is built the way it is — are still the reasons those things are the
way they are.

**The page answers questions now, and quotes itself doing it.** `Ctrl K` was a
list of twelve commands; it is an ask box with commands under it. Type three
characters or more and `src/utils/answer.js` searches the same `constants` the
sections render — 19 documents, one per role, degree, stack group, project, plus
the availability card — and returns the passages that match, each with the
section it lives in. `↵` jumps there.

**Nothing is generated. No key, no backend, no model call.** Every answer is a
verbatim string from `constants`, and a test asserts it by checking each
returned passage against the joined source. The reason is the page's own
argument: every number here is measured or absent, and a generated sentence
about the work is the one sentence nobody measured. It is also why this works on
Pages with the network off.

**Two ranking faults, both found by asking it a real question.** "What did he
ship on Azure" first answered with a project that does not mention Azure: long
documents win on volume, fixed with BM25's length normalisation. It was *still*
wrong, because the page says "Shipped" and a reader types "ship" — fixed with a
four-line stemmer (`-ing`, `-ed`, `-s`, then one doubled consonant, so `shipp`
→ `ship`). `test_ship_matches_shipped` exists because the first fix alone did
not hold.

**The trap here: an alias table is not optional.** `hire`, `job`, `available`
appear nowhere on this site, so "are you available for hire" retrieved *nothing*
until six aliases were added. The words a reader arrives with are not the words
the page uses, and a headline feature that returns nothing on the first natural
question is worse than no feature.

Measured on the running page: Azure question returns the AdvanSoft role first;
`↵` scrolls 0 → 1669 with the section top at 88px and restores `body.overflow`;
arrow keys cross from answers into commands in one key set; two characters show
commands only; nonsense returns one row offering the email; 390×844 DPR 3 fits
the panel at 358×490 with no sideways scroll; Preprint renders the passage at
`rgb(17,17,19)` on white. Bundle 100.22 → 103.84 kB raw, 32.77 → 34.18 kB
gzipped, both builds made in the same tree. `npm test` is 7/7 and CI runs it
between lint and build.

**Before this branch, on `main`:**

**The nav bar no longer returns on a twitch.** It hides on a deliberate
downward push (12px in one frame) and used to come back on 2px of upward
movement, which meant any nudge while reading slid 77px of bar in and out at the
top of the eyeline. The return is now hysteretic: upward movement has to
accumulate 200px — two mouse-wheel notches, or a thumb swipe — before the bar
comes back, and **any downward movement zeroes that total**, so jitter in both
directions never sums to a return.

Measured on the built bundle at 1280x720: scrolled down to y=1600 the bar is
`-translate-y-full`; 50, 100 and 150px of upward movement leave it hidden; at
210px it shows. Eight rounds of (up 50 / down 20) — 400px of upward movement
in total — leave it hidden, and a single 250px upward swipe shows it. The other
four guards are unchanged and re-verified: y<=160 always shows, a jump the
reader asked for never hides, focus inside the bar shows it, the mobile menu
shows it.

**Stack was redesigned.** It was a 3x2 grid of glass cards whose only heading
was a 12px uppercase red label, and the intro paragraph's claim — that the six
groups sit in order on a path from raw data to a running product — was stated in
words and then thrown away by a grid that shows six equals.

Three things now carry that claim:

| | |
| --- | --- |
| **The pipeline rail** above the grid | six tinted segments between `raw data` and `running product`. The hovered group's segment brightens and doubles in height, so a card says where on the path it sits. `aria-hidden`: it is a picture of what the intro already says in words |
| **A stage numeral** `01`–`06` on every card and every phone row | the same ordering, in the one place a reader looks after the title |
| **A cursor spotlight** in the group's own colour | `--mx`/`--my` written imperatively to the card node on pointermove, read by `.stack-card::before` |

The card heading moved from 12px uppercase accent-red to 17px display
semibold, so the hierarchy inside a card finally runs heading > note > tools
instead of three near-equal bands.

**One colour, two forms.** Each group now carries `dot` (a literal Tailwind
class, because Tailwind scans for literal strings) *and* `tint` (the raw
`--c-cat-*` variable name, because `rgb(var(...) / 0.46)` cannot be recovered
from a class). They are declared adjacent so they cannot drift apart unnoticed.

**The trap here: do not put `overflow: hidden` on the card.** Clipping the
spotlight that way also clips the glossary panel TagTerm opens below a chip,
which is the entire point of the section. The pseudo-elements take
`border-radius: inherit` instead, which clips the gradient and not the content.
The second half of that: both pseudo-elements sit at `z-index: -1`, where a
negative-z child paints *above* its parent's own background and *below* the
parent's in-flow text — so the glow is in the card's material rather than over
its words.

Measured in Chrome at 1440px and 390px, both themes: `--cat` resolves per card
(`132 160 186` on Data engineering), the spotlight follows to
`radial-gradient(288px 224px at 30% 40%, rgba(132,160,186,0.46) …)`, the border
tints to `rgba(132,160,186,0.55)`, the rail reads `["1","0.16","0.16","0.16",
"0.16","0.16"]` with card 1 active, the glossary panel renders fully outside the
card, and `scrollWidth === clientWidth` on the phone.

The site is live, merged to `main`, and verified at seven viewport widths in
both themes and at both ends of the text-size control. There is no work in
flight and nothing half-applied.

**There is CI now, and that is the biggest change of the three.**
`.github/workflows/ci.yml` runs install, lint, build and the crawler-file guard
on every PR to `main` and every push to `main` — the same four steps, same order,
same Node 22 as the deploy in the other repo, so the two cannot disagree about
what green means. Before it, **this repository had no workflow at all**: nine PRs
merged in one day with nothing checking them but a human reading the diff.

The guard was proven to fail, not just to pass: against a copy of `dist`, a
deleted `llms.txt`, a zero-byte `og.png` and a stripped JSON-LD each exit 1,
and an intact tree exits 0. A check that has only ever passed is not yet a check.

Two small ones with it: **`Quote.jsx` deleted** (dead, and the bundle already had
zero occurrences of its `figcaption`, so Rollup had tree-shaken it and the
deletion changed the shipped output not at all), and **the theme change fades**
rather than cutting — `.theme-switching` on `<html>` for 260ms, scoped to the
moment of the change because a permanent global colour transition would animate
every hover too.

**The trap in that last one is worth carrying:** the reduced-motion override has
to be placed AFTER the fade rule. The global reduced-motion reset near the top of
`index.css` is `!important` too, and between two equally important, equally
specific rules the later one wins — without the ordering, adding a fade quietly
re-enables motion for readers who asked for none.

The docs were also brought back in line with the code (`README`, the components
README, `TYPE-AUDIT`), which had drifted through a day of redesigns.

Before those, `feat/reading-themes` squash-merged and deleted: **six palettes, not two.**
Slate and Ink (dark), Paper, Manuscript, Clarity and Preprint (light). Preprint
is an arXiv/IEEE page and its accent is `#B31B1B`, arXiv's own Cornell red,
which sits in the same family as this site's lava red.

**`data-scheme` is the new second axis.** Every structural rule — glass shadows,
bloom, grain — keys off it, so a palette declares light-or-dark once in the
`themes` registry and inherits the rest. Those rules used to read
`:not([data-theme="dark"])`, which stops being true at the third palette.

**The content is identical in all six**, deliberately. The ask was for themes
"from the mindset of" a recruiter, a professor, a hiring manager; what varies is
the reading condition, never the claims. A portfolio that shows different people
different facts is not a theme.

Every palette measured for contrast rather than derived — all six clear AA for
text and 3.0 for control boundaries; the table is in the WORKLOG.

**Two traps this set:** a nested element cannot opt into another palette
(`:root[data-theme=...]` only ever matches the document root, so themed swatches
must paint from stored values), and **a bare `<span>` is inline, so it ignores
width** — the swatches rendered 2px wide until they were given `block`.

Before it, `redesign/premium-dark` squash-merged and deleted. Feedback was "looks like a
website from 1990"; it did not, it looked like **2020 developer-brand**, which
is a different and more fixable problem. Four causes, none of them the content:

| Was | Now |
| --- | --- |
| Mono on nav, wordmark, status, every label | **Mono is for identifiers only** — code, URLs, repo and tool names, clocks, counts. Everything else is the sans |
| One soft shadow on cards, flat ground | Three-layer elevation, a radial bloom behind the hero, 3.5% feTurbulence grain |
| Flat saturated CTA at 6px radius | `.btn-accent` — lit gradient, coloured ambient glow, 1px hover lift |
| 33 boxed chips in Stack on a phone | Bare flowing terms; **1,364px → 1,131px, 17% shorter**, touch target kept |

**The trap this pass set:** the hero bloom shipped with a `-10%` horizontal
inset, which bled 39px past each edge and took the document to 430px wide on a
390px phone — a sideways scrollbar on every page. The mobile battery caught it.
**Any decorative element positioned with a negative inset widens the document.**

Before it, `fix/code-band-flicker` squash-merged and deleted — **the first fix in this
sequence that came from a real phone rather than an emulated viewport.** The
hero's code band flickered while scrolling, because a mobile browser collapses
its URL bar as you scroll and the hero is a viewport-height box: the slack the
band measures itself against changed by the bar's height several times per
gesture, walking it 7 lines → 5 lines → hidden and back. It now decides against
the SMALLEST room it has seen rather than the current one, and debounces, so the
answer settles once and stays. **A viewport-height box on mobile is not a fixed
height — anything measuring against one has to assume it moves.**

Before it, `refactor/less-template-more-evidence` squash-merged and deleted, after the
question "does this read as AI slop". The craft did not; the skeleton did.
Three changes, and the first is the one that mattered:

| Change | Why |
| --- | --- |
| **Deleted the six About capability cards** and the `services` constant | They restated Stack's six groups in adjectives instead of tools, and they were claims on a page whose hero promises evidence. About: 1,446px → 966px |
| **Project covers build left to right as you scroll** | The diagrams are left-to-right pipelines, so they now draw in the direction they run. A `destination-out` wipe over the finished frame, NOT a build parameter through six 250-line drawers |
| **Section eyebrows carry derived facts** | `4 roles · since 2020`, `6 areas · 56 tools`, `6 built · 1 live`, `4 routes · US Central`. All computed from the data, so the rendered number cannot go stale even when prose about it does |

**Still the default section names** — Overview, Experience, Stack, Projects,
Contact. Renaming those is writing his copy, and was left alone.

Before it, `feat/availability-stacked-facts` squash-merged and deleted: the "Open to work"
card is a stack of grouped facts instead of six evenly spaced rows, with the
parts that were one sentence given a line each, plus a per-fact stagger, a rule
that draws under each label, and a rail that fills as the card crosses the
screen. **It also fixed a reduced-motion claim that had been false since the
card was written:** the `prefers-reduced-motion` block in index.css zeroes CSS
`animation-duration` and `transition-duration` only, and framer writes `opacity`
and `y` as inline styles from its own rAF loop, so those were never neutralised
— the facts still slid 8px. `initial={reduced ? false : "hidden"}` is what stops
framer, and Hero.jsx was already doing it. **Assume nothing about that CSS block
covering framer.**

Before it, `feat/hero-code-completion-band` squash-merged and deleted: the hero's lower
slack on a phone — 253px of it at 390x844, and 331px from the last hero element
to "Overview" — now holds a Python binary search being completed and then run,
cycling found / missing / empty so the guard clause is always seen earning its
place. It **measures whether it fits** rather than trusting a breakpoint,
because the reader's text-size control changes the slack without changing
anything a media query can see. It spends what it measures on lines of the
function, 4 to 7 of them, and hides only when even four will not fit: at 112%
that is a 5-line window, where the first version hid itself over a single pixel.
The division cannot oscillate because neither of its terms depends on the
current line count — see the WORKLOG. Drawn with no check at all at 360x640 it
overlapped the lede by 156px.

Before it, `fix/mobile-layout-and-nav` squash-merged and deleted, four commits,
all four phone-layout faults found by measuring the running page. Full reasoning in
`docs/site/WORKLOG.md`, the 2026-09-12 entry headed "four layout faults
on a phone":

| What | Where it lives now |
| --- | --- |
| Contact rows sized by the card, not the viewport — a container query, threshold in `em` so it follows the A+ control | `.contact-row` in `src/index.css` |
| The nav bar stops hiding during a jump the reader asked for; `section-jump` for the two jumps that change no hash | `Navbar.jsx`, `CommandPalette.jsx`, `SideRail.jsx` |
| The Stack glossary panel is clamped inside the viewport instead of centred off the edge of it | `TagTerm.jsx` |
| The mobile menu stops clipping its own top, and its close button stops scrolling away | `Navbar.jsx` |
| One `readable()` for a URL printed to a human, was four copies that had drifted | `icons.js` |

**Two traps that cost real time here, both about what a box is measured
against.** A container query resolves `em` against the *container's*
font-size — that is the only reason the contact breakpoint can follow
`--type-scale`, which never touches the root font size. And a `backdrop-filter`
makes its element the containing block for `position: fixed` descendants, which
is why the menu's close button kept scrolling until the blur came off.

Before that, `redesign/highway-premium` squash-merged as `630a38f` (81 commits),
branch deleted, then six commits on `main`, all shipped and deployed:

| Commit | What |
| --- | --- |
| `4b0c58f` | Hamburger present at every width; nav stops hiding itself on a phone; page stops scrolling sideways |
| `632b392` | Fluid type and padding; Stack becomes one block on a phone; Collaborate moves to the end and off mobile |
| `dd2c5c1` | Overview text was being clipped mid-word; justification limited to wide measures |
| `8fad65f` | Crawler notice off the phone's reading flow |
| `0c8b15d` | CTA starts at Experience; two disclosures that earned nothing removed |
| `d9e8a7f` | Anchor landing, stacked contact rows, heavier body text on phones, token wave on mobile |

## The next action

Nothing is blocking and nothing is half-applied. In order of value:

1. **Safari, Firefox and a real iPhone.** This is now the highest-value thing
   left and it has moved from "prudent" to "overdue": the live site leans on
   `color-mix` for every scene, `@property` for the role-edge light, WebGL for
   the hero and `position: sticky` for the deck, and **none of it has ever been
   opened outside Chrome**.
2. **Act 3 of the campaign: projects as product pages.** Full-bleed cover art, a
   spec row, the diagram as hero rather than thumbnail. **Capped by the missing
   screenshots** — a software campaign normally leads with the product.
3. **Act 4: scroll choreography.** Pinned scenes, type that arrives as you enter
   one. The Roles deck is the pattern; generalising it is the work.
4. **Act 5: a persistent CTA** — one "open to roles" bar that follows the reader
   rather than a single button in the hero.
5. **Per-project detail pages** (P1/L), and **prerendering** (P1/L) if
   AI-crawler visibility starts to matter more than it does today.

Blocked on the owner rather than on work: **project screenshots**, real metric
numbers for the covers (do not invent them), testimonials, and the Vercel deploy
(`vercel login` is interactive).

### One piece of housekeeping

`redesign/de-slop-portfolio` still exists locally. It is **behind** `main`, not
ahead: its 26 commits are pre-squash-merge history whose content shipped long
ago, and the branch is missing `ci.yml`, `og.png`, `llms.txt` and 40 other files
that `main` has. Safe to delete; left alone because deleting someone's branch is
their call. `archive/pre-consolidation-2026-09-11` is deliberate and stays.

## How the deploy works

One repo, since 2026-10-16. `.github/workflows/deploy.yml` builds `portfolio/`,
fails if `robots.txt`, `llms.txt`, `og.png` or the JSON-LD are missing from
`dist/`, and publishes.

It runs on a merge to `main` that touches `portfolio/` or the workflow itself,
and on demand:

```bash
gh workflow run deploy.yml
```

**A docs-only merge deploys nothing**, by a `paths:` filter. That is deliberate:
most merges here are documentation and rebuilding the site for them changes the
bundle hash for no reason.

### Why it was two repos, and what the split cost

Only a repo named exactly `<user>.github.io` is served from the domain root.
The site repo was called `Personal-Portfolio`, so a second repo owned the name
and checked this one out to build it.

That second repo pinned `SOURCE_DIR` in its own workflow. When `3d_portfolio`
was renamed to `portfolio` here, the build kept passing, CI stayed green, and
deploys broke — in a file in a different repository, with no error until
someone tried to deploy.

The fix was to rename this repo into the name, which removed the reason for the
split. The old repo is kept as `pages-deploy-legacy`, archived, holding the
three files it always held.

Pages serves through a CDN, so a fresh deploy can take a minute to appear. Add a
cache-busting query (`?v=2`) when checking, or you will verify the old bundle
and believe the deploy failed.

**Vercel is still not set up.** `npx vercel whoami` returns `Logged out` and the
login is interactive. If a Vercel URL ever becomes the primary address, six
absolute URLs in `portfolio/index.html` change together and nothing else
does; a comment in that file says so.

## Traps, each one already paid for

- **The site is not at the repo root.** Vercel needs `--cwd portfolio`, or
  Root Directory set to `portfolio` in the dashboard.
- **A `tailwind.config.js` change needs a dev-server restart.** Vite will not
  pick up new tokens on HMR; the classes silently resolve to nothing and you
  measure transparent backgrounds or 16px fallback type and wonder why. Cost
  two debugging detours this session alone.
- **`fixed` breaks inside a transformed ancestor.** A transformed element
  becomes the containing block for its fixed descendants. This is what made the
  mobile menu 192px tall instead of full-screen for weeks. If something
  `fixed` is mis-sized, look up the tree for a `transform`.
- **Never reach for `overflow-x: hidden` to stop sideways scroll.** It hides the
  symptom at every width and breaks `position: sticky` anywhere inside, because
  an overflow container is also a scroll container. The career diagram in
  Experience depends on sticky. Find the element that is too wide instead.
- **A grid item will not shrink below its content's min-content width.** Default
  `min-width: auto`. One `whitespace-nowrap` on a long string held a card 38px
  wider than its column and clipped the text beside it. `min-w-0` on the item
  and `minmax(0,1fr)` on the track are the fix.
- **Framer-motion variants only propagate through motion components.** A plain
  `<div>` between an animated parent and its children cuts the chain and the
  children render at opacity 0, with nothing logged.
- **Do not trust a canvas measurement taken right after `scrollIntoView`.** The
  covers pause off-screen and clear on resize, so an early reading shows 0 ink
  on a cover that is fine. Scroll, wait ~900ms, then measure.
- **`while read` drops a final line with no trailing newline.** It silently
  skipped one repo out of 49 during the protection run. Reconcile results
  against the input list, not against the loop's own success count.
- **`.gitignore` must stay ASCII.** It was corrupted once by a PowerShell `>>`
  writing UTF-16LE; git stops parsing at the first NUL byte.
- **`portfolio/read.md` is historical. Do not run it.**
- **A grep cannot read a PNG.** `public/og.png` kept an old job title through a
  whole rename. Its source is `docs/site/og-card.html`; regenerate it
  whenever the title or tagline changes.

## What is deliberately not done

- **No sitemap.** One page with in-page anchors. Reasoning is in
  `public/robots.txt`.
- **No prerendering**, so AI crawlers see only `<noscript>`. `public/llms.txt` is
  the deliberate answer.
- **`NeuralField` is desktop-only and stays that way.** Every node is read from
  `getBoundingClientRect()` on the two edge docks, which exist only from 1024px.
  Below that there is nothing to read, and inventing coordinates would
  contradict the one claim that makes it a diagram rather than decoration.
- **No enforced PR workflow.** Impossible on a personal account without locking
  the owner out; see `docs/repo/REPO-SECURITY.md`.
- **`llms.txt` and the JSON-LD are hand-written copies** of facts in
  `src/constants/index.js`. Both carry a comment naming what they mirror.

## Where the rest of the reasoning lives

| Question | File |
| --- | --- |
| What changed, when, and what was measured | `docs/site/WORKLOG.md` |
| What is left, as tickets | `docs/site/BACKLOG.md` |
| Why the type is the size it is | `docs/site/TYPE-AUDIT.md` |
| What a phone gets and a desktop does not | `portfolio/README.md`, "What a phone gets" |
| Which file to open for a given change | `portfolio/README.md` |
| Which component owns what | `portfolio/src/components/README.md` |
| Branch protection across the account | `docs/repo/REPO-SECURITY.md` |
| How to contribute, and LLM-written patches | `CONTRIBUTING.md` |
| Where the five earlier drafts went | `README.md` |
