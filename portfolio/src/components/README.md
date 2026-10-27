# src/components

Thirty files. Read the table, not the directory.

## Change to file

| You want to change | Open |
| --- | --- |
| The headline, the three claim lines, the CTA | `Hero.jsx` |
| How a section announces itself, and its fact line | `SectionHead.jsx` |
| Portrait, lede, the three proven claims, availability card | `About.jsx` |
| Roles and degrees, the card deck, date alignment | `Experience.jsx` |
| Stack: the header, the view toggle, the definition strip, the tool list | `Tech.jsx` |
| Stack as a system: planes, nodes, flow payloads, the `?`, `less detail` | `StackDiagram.jsx` |
| The planes, their nodes, and what flows between them | `systemPlanes` / `systemSubstrate` in `../constants/index.js` |
| What fills each role on AWS / GCP / Azure | `platformMatrix` in `../constants/index.js` |
| Why a tool is in the box it is in | `../../docs/STACK-TAXONOMY.md` |
| What the closing band retrieves, and the questions it offers | `RetrievalRank.jsx` |
| Which tools exist, and their plain-English definitions | `stackGroups` and `glossary` in `../constants/index.js` |
| Which tools get the filled chip, and each dot's colour | `stackGroups` in `../constants/index.js` |
| Project cards, and the drawings on them | `Works.jsx` |
| The contact card, and the URLs printed in it | `Contact.jsx` |
| Whether a contact row is one line or two | `.contact-row` in `../index.css` |
| The notice aimed at crawlers and LLMs | `AgentNote.jsx` |
| "Open to work": copy, animation, the Reach out button | `Availability.jsx` |
| Top bar: links, hide-on-scroll, mobile menu | `Navbar.jsx` |
| Right edge: section markers | `SideRail.jsx` |
| Left edge: contact icons | `ContactRail.jsx` |
| What a tech chip does on hover or click, and its two tiers | `TagTerm.jsx` |
| Whether a tool shows its logo, and how big | `ToolGlyph` in `TagTerm.jsx` |
| Which brand logos exist at all | `scripts/gen-tool-icons.mjs` -> `toolIcons.js` (generated, 38 marks) |
| The mark for RAG, Transformers, S3 and anything with no upstream logo | `conceptIcons.js` (hand-drawn) |
| The reader's own text-size control (A- / A+) | `FontSizeToggle.jsx` |
| What collapses behind a disclosure on a phone | `MobileCollapse.jsx` |
| The diagram in the margin beside each role | `CareerTrack.jsx` |
| The "open to collaborators" closing band | `Collaborate.jsx` |
| The one scroll-reveal used by every card | `Reveal.jsx` |
| Shared canvas geometry and the seeded RNG | `../utils/draw.js` |
| The ask box: answers, commands, keyboard | `CommandPalette.jsx` |
| Which passage a question retrieves, and its ranking | `../utils/answer.js` |
| The hero field in 3D: layers, depth, parallax | `NeuralField3D.js` |
| Which field runs, and the 2D fallback drawing | `NeuralField.jsx` |
| The shape both fields draw: layer sizes, wiring, timing | `netShape.js` |
| The token wave in Stack, desktop only | `TokenStream.jsx` |
| The Python search band on a phone | `CodeCompletion.jsx` |
| Brand glyph paths, and the list of off-site links | `icons.js` |
| Scroll-reveal timing used across the page | `Reveal.jsx` |
| The scroll hairline at the top | `ScrollProgress.jsx` |
| Clock zones and their labels | `LiveClock.jsx` |
| The reader's own zone, and the hour difference | `../utils/localzone.js` |
| The colophon line | `Footer.jsx` |

## What owns what

Each file's header comment states what it owns and what it explicitly does not.
Those lines are the contract; when a change crosses two files, one of them is
probably wrong.

A few boundaries worth knowing before editing:

- **`icons.js` owns every off-site destination.** `SocialIcons`, `ContactRail`,
  `Contact` and `CommandPalette` all read `socialLinks()`. Adding a profile is
  one edit, in `constants`, and it appears in four places.
- **`useActiveSection` owns "which section am I in".** `Navbar` and `SideRail`
  both consume it. They used to run separate observers and could disagree.
- **`ThemeToggle` owns the theme**, all six of them, and writes both
  `data-theme` (the palette) and `data-scheme` (light or dark, which every
  structural rule reads). `CommandPalette` dispatches `set-theme` with an id
  rather than writing the attributes itself; when it wrote them directly the
  toggle desynced and needed two clicks.
- **Two icon files, maintained in opposite ways.** `toolIcons.js` is generated
  and must never be hand-edited; `conceptIcons.js` is hand-drawn and has no
  generator. `glyphs.js` re-exports both, and that is the module `TagTerm`
  imports lazily, so `npm run icons` can never overwrite the drawn set.
- **Concept marks are strokes, brand marks are fills.** `ToolGlyph` switches on
  `s: 1`. A stroke path rendered as a fill turns into a blob, and a silhouette
  rendered as a stroke turns into an outline of itself.
- **The tool logos are a generated file, not a dependency.** `simple-icons` is a
  devDependency; `npm run icons` writes the 38 marks this site names into
  `toolIcons.js`, and that module is what ships — in its own lazy chunk, because
  brand paths are heavy against a 33kB entry bundle.
- **Some products have no mark upstream, and never will.** simple-icons 16.31.0
  carries no `amazon`, `aws`, `azure` or `pinecone` entry — the project removed
  several large corporate logos over trademark policy. Those terms are drawn in
  `conceptIcons.js` as what the product IS (a bucket, a key-value table, a
  nearest-neighbour cluster), never as a recalled brand mark: a brand mark from
  memory is a claim about someone else's identity and is simply right or wrong.
- **Stack has two views over one dataset.** `Tech.jsx` owns the list and the
  toggle; `StackDiagram.jsx` owns the system reading. Both resolve the same 56
  terms and both call the same `setHovered`/`pinTerm`, so a term is defined in
  one place and pinning survives a view switch. The two filings are separate
  constants — `stackGroups` by skill area, `systemPlanes` by responsibility —
  and `utils/stages.test.mjs` fails if they stop covering the same set.
- **The diagram's boxes are RESPONSIBILITIES, not skill areas.** That is the
  only reason the second view exists: a box called "Data engineering" is a
  category of a person, and redrawing the list with arrows added is not a
  second reading of anything. If a change starts making the stages look like
  `stackGroups` again, the view has lost its justification.
- **The category tints are a SCALE, not a set.** One hue at six intensities
  with monotonic luminance; `--c-flow-1..3` alias three of them for the
  diagram's planes and `--c-flow-off` is the substrate's neutral. If you
  retune them, check luminance monotonicity by computing it — chroma rising
  while lightness stays flat looks like a ramp and is not one.
- **A PLACEMENT IS A CLAIM, and it has its own document.** Which box a tool
  sits in asserts what kind of thing it is, and getting it wrong is the error a
  reader who uses that tool spots first. `Claude` shipped in the `Inference`
  box beside `vLLM` and `Ollama` — an inference server, a local runtime and a
  hosted model, filed as though they were interchangeable. Before moving a tool
  between boxes, read `docs/STACK-TAXONOMY.md`; it carries the rule, all 56
  placements with reasons, and the calls worth arguing with. `npm test` catches
  drift between the two filings but **cannot** catch a wrong box.
- **The cloud matrix is a mapping, not a CV.** Only `mine` says anything about
  the owner; ten rows carry an em dash meaning "the slot is real and he is not
  claiming it". `test_the_mine_column_only_names_real_tools` enforces that the
  column may only name something already in `stackGroups`.
- **A figure has to be actionable, not merely measured.** "Every figure is
  measured or absent" was satisfied by both a raw TF-IDF score and a
  percentage that was always 100%, and both were wrong. If a reader cannot act
  on the number, it is not finished.
- **Anything in the diagram that is not a tool must not look like one.** The
  flow payloads (`tables`, `features`) were lowercase faint mono sitting
  beside lowercase faint mono tool names, and read as three more skills. They
  are now dashed accent capsules with an arrowhead and wide uppercase
  tracking. Measured: payload ink `rgb(155,20,20)`, uppercase, 1.92px
  tracking, against a tool at `rgb(17,17,19)`, no transform, normal tracking.
- **Build tooling is not the stack, and is not named anywhere.** How a thing
  was built and what it is made of are two different lists, and this page
  carries only the second.
- **Never "optimise" an SVG path with a regex.** Rounding coordinates with
  `/\d*\.\d+/g` corrupted every mark using compact arc syntax: in
  `a5.5 5.5 0 01.5.5` the two arc FLAGS and the next number are written `01.5`,
  and rounding turns three tokens into one. Docker, MLflow and Kubernetes
  rendered blank or as a dot. The file parsed, the build passed, and only
  looking at the page found it.
- **Two fixed docks overlap the page from 1024px up**, and neither is in the
  flow: `ContactRail` (left) and `SideRail` (right). The clearance lives in
  `styles.paddingX` as `rail:px-[4.5rem]` — remove it and paragraphs run under
  the icons, measured at 1024 where `4.5vw` is 46px against a dock ending at 48.
- **`TagTerm` has two modes.** Default teaches (hover opens the definition);
  `plain` states (native tooltip only). Cards pass `plain`.
- **`CommandPalette` shows two lists in one listbox.** Answers retrieved from
  `utils/answer.js` first, then commands. Both are plain entries with a `run`,
  so one set of arrow keys drives both; the `kind` field only changes how a row
  draws and which header sits above it.
- **`utils/answer.js` never writes a sentence.** It returns passages that are
  already in `constants`. If a change there starts producing text the page does
  not otherwise say, the feature has lost the thing that justified it.

## Traps in this directory

- **Verify layout against `npx vite preview`, not the dev server.** React's
  StrictMode double-mount makes framer's `whileInView` fire unreliably in dev,
  so sections sit at `opacity: 0` after scripted scrolling and look like a
  regression that does not exist in a production build. This cost a false
  bug report; the live site and `vite preview` both behaved correctly.

- **`Works.jsx` seeds each cover's RNG from the project name**
  (`hash(name || cover)`). Renaming a project silently changes its drawing. The
  build will not tell you.
- **Framer propagates variants only through motion components.** Wrapping
  children in a plain `<div>` breaks the chain and leaves them stuck at
  `opacity: 0`. This has caused two separate invisible-content bugs.
- **`viewport={{ amount: n }}` is a raw IntersectionObserver threshold**, and
  `intersectionRatio` is capped at `viewportHeight / elementHeight`. A section
  taller than about four viewports can never satisfy `0.25`. Use `"some"`.
  This once made the whole Projects section invisible on every phone.
- **The Experience roles are a sticky deck, and `position: sticky` dies inside
  any scroll container.** Adding `overflow-x: hidden` or `overflow: auto` to a
  wrapper — the section, the grid, the `<ol>` — silently turns the deck back
  into a flat list with no error anywhere. The exception is `html`/`body`, whose
  overflow propagates to the viewport instead of making a scroll container:
  `body { overflow-x: hidden }` is in `index.css` today and the deck works over
  it. Any element below those two is the hazard.
- **The current role's edge is a masked conic gradient, not a border.**
  `.role-card[data-current="true"]::before` in `index.css` paints a ring by
  subtracting the padding box from the border box with a two-layer mask, and
  animates `@property --role-edge`. Two things break it silently: removing the
  `@property` block (the custom property stops interpolating and the light
  stops travelling) and dropping the plain `border-color` rule beside it (a
  browser without `@property` then shows no mark at all).
- **Only one card in the deck is lit.** `useCoveredCards` marks a card
  `data-covered` once the next has climbed halfway up its face, and the CSS
  dims that card's CHILDREN — never the card itself. Putting `opacity` on
  `.role-card` makes its ground translucent and two covered cards show each
  other's text through their own backgrounds.
- **That handler reads all four rects before writing any attribute.**
  Interleaved, it forced a synchronous layout per card per frame: 50ms worst
  frame while scrolling the deck, against 33.6ms batched.
- **The deck turns itself off when a card does not fit.** `useDeckFits` in
  `Experience.jsx` measures the tallest card against the room under the navbar,
  because a pinned card taller than the viewport hides its own bottom — the
  reader scrolls and the cut-off part never arrives. Measured at 1280x620 with
  the text control at 140%: a 686px card in 524px of room, 192px unreachable.
  It is a measurement and not a media query for the stated house reason: the
  text-size control changes the height without changing anything a query sees.
- **`CareerTrack` picks the active role as the LAST card that has arrived**, not
  the one nearest the middle of the screen. In a stack every pinned card sits
  within 40px of the same top, and "nearest the middle" flickered between two
  roles on one scroll notch.
- **A canvas keeps its first context for life.** `NeuralField` must not call
  `getContext("2d")` until it knows it is the one drawing, and `NeuralField3D`
  creates its own element rather than borrowing that one — `forceContextLoss()`
  on teardown poisons a canvas for the next renderer, which React's development
  double-mount triggers immediately. The symptom is a blank field and
  `THREE.WebGLRenderer: Cannot read properties of null (reading 'precision')`.
- **three.js must stay out of the `vendor` chunk.** `vite.config.ts` returns
  `undefined` for it on purpose. Naming it in `manualChunks` puts 130kB gzipped
  into the entry graph for every reader, including the phones the dynamic
  import exists to spare.
- **Import three by name, never as a namespace.** `await import("three")` inside
  a function defeats tree-shaking, because a namespace object must carry every
  export: measured, that was 191.81kB gzipped against 130.73kB for the ten
  named classes this scene uses.
- **Canvases must re-read their size.** A canvas sized once inside an effect
  stays at its old backing-store dimensions after a resize, and static ones never
  repaint at all.
- **A `<canvas>` is a REPLACED element, so `left` + `right` does not stretch
  it.** Given both insets and `width: auto` it keeps its intrinsic width and
  ignores `right`. `TokenStream` at `left-[33%] right-0` measured 416px wide
  instead of the ~1060px the insets implied, and landed back across the
  heading. Always give it an explicit width. Same class of bug as
  `renderer.setSize(w, h, false)` in the hero field, which left that canvas at
  its intrinsic 2401x1324 on a 1601x883 viewport.
- **Never convert a canvas backing store to CSS pixels with
  `canvas.width / innerWidth`.** That ratio *is* the device pixel ratio, so the
  arithmetic agrees with the bug and a mis-sized canvas measures as correct.
  Convert through `getBoundingClientRect()`.
- **A bare `/* */` in JSX children is TEXT, not a comment, and it renders.**
  The build passes and eslint passes; the only symptom is space that will not
  go away. One dropped `{}` put 120px between the Stack header and its grid,
  found only by measuring the section and seeing it GROW when the edit should
  have shrunk it. Comments in JSX children are always `{/* ... */}`.
- **Ambient canvas work must not cross text.** `TokenStream`'s band now runs
  out of the Stack heading, through the space the definition card used to
  occupy. Re-measure it against the heading, meta, intro, strip and toggle
  after any header change. The note below is the history of why:
  whose height moves with the breakpoint: the toggle's question wraps to two
  lines below 1536px, lifting the toggle from y=178 to y=161. The band height
  is responsive for that reason alone. Re-measure after adding anything to the
  top right of that section.
