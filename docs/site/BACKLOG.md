# Feature backlog

Future work for the portfolio, as tickets. Priority: **P0** ship-blockers,
**P1** high-value, **P2** nice-to-have. Effort: S / M / L. Status: `[ ]` todo,
`[~]` needs input, `[x]` done.

> Current state (2026-09-15): live at <https://sathishkumarai.github.io/>, built
> from `main`, deployed and verified by bundle hash. Six palettes with **Paper as
> the default**, reader-controlled text size, full-bleed scenes, a sticky Roles
> deck, a WebGL hero field on desktop, tool logos on every named technology, and
> an ask box that retrieves from the page's own copy.
> Current as of 2026-10-27: `npm test` is 42 checks in CI. The Stack now opens on
> the 17-node system diagram at `lg` and above (#88); the hero's emoji cursor is
> gone (#83); a scroll-down button mirrors back-to-top on the left edge (#85); the
> tool count is derived rather than typed and the ask-palette shortcut is spelled
> per platform (#86); the stage numerals, hero field labels and Slate's `--c-faint`
> all clear 4.5:1 (#87); and the thin links carry a 44px target on phones (#89).
> See [ARCHITECTURE.md](ARCHITECTURE.md) and [DECISIONS.md](DECISIONS.md).

---

## Next up, in order of value (added 2026-09-15)

The eight below are the whole of what is worth doing next. Everything after them in
this file is older and lower-value; if you only have an afternoon, it is the first
one.

- [ ] **(P0, S) Open the live site in Safari, Firefox and on a real iPhone.**
  Overdue rather than prudent. The deployed page now leans on `color-mix` for
  every scene ground, `@property` for the travelling role-edge light, WebGL for
  the hero, and `position: sticky` for the Roles deck — **and none of it has ever
  been opened outside Chrome, by anyone.** The hide-on-scroll handler also clamps
  scroll position for iOS rubber-banding and that code has never executed on an
  iPhone. Check in this order: scene grounds and hairlines, the role-edge light
  (it should fall back to a static tinted border where `@property` is missing),
  deck pinning and covered-card dimming, the WebGL field and its 2D fallback, the
  ask box, the six palettes. *Plane: `COD-194`.*
- [~] **(P1, L) Campaign act 3: projects as product pages.** Full-bleed cover art,
  a spec row beneath it, the diagram as hero rather than thumbnail. **Blocked on
  the owner:** a software campaign leads with the product and this repo has never
  had a single screenshot. Three would change the shape of the work entirely.
  *Plane: `COD-195`.*
- [ ] **(P1, M) Campaign act 4: scroll choreography.** Pinned scenes and type that
  arrives as you enter one. The Roles deck is the pattern; generalising it is the
  work. Nothing blocks this — `Reveal.jsx` and the scene structure already exist.
- [ ] **(P2, S) Campaign act 5: a persistent CTA.** One "open to roles" bar that
  follows the reader instead of a single button in the hero. Small, and worth
  doing after act 4 so it does not fight the scene transitions.
- [ ] **(P1, M) Draw the stack planes for a phone.** PR #88 made the Stack open on
  the 17-node `systemPlanes` reading, but only from `lg` - `StackDiagram` is
  `hidden lg:block`, so a phone still opens on the six flat groups. Desktop and
  phone now show two different primary taxonomies of the same 56 tools, which is
  better than the better reading being hidden from everyone but is half the fix.
  Needs a design decision, not a port: the desktop payload arrows run horizontally
  and a phone has no horizontal. Keep the flat list as "every tool, A-Z" - it is
  genuinely the better way to scan for one name. *Plane: `COD-405`.*
- [ ] **(P2, M) Contrast sweep over the glass surfaces.** PR #87 fixed everything on
  an opaque ground - 48 elements across three themes, zero failures. What is left
  cannot be measured by any tool here: an ancestor-walk put a hero clock at
  **4.93:1** and the bundled detector put the same element at **1.4:1**, because
  neither can see the composited result of `backdrop-filter` over whatever is
  scrolled beneath it. Needs pixel sampling from a real capture per theme. Do not
  trust a naive whole-page sweep: it reports ~77 per theme and counts `sr-only`
  text ("Text size 100 percent" at 1.21:1) as failures. *Plane: `COD-406`.*
- [~] **(P2, S) DECISION: what to do about `TokenStream`.** Needs the owner, so
  nothing was changed. Measured: it crosses exactly one text element, the "Stack"
  heading, which `src/components/README.md` records as deliberate ("runs out of the
  Stack heading"); the intro, meta, strip and toggle are all clear. And its
  "corrupted" fragments - `im - ated - re - trie - val` - are genuine subword
  tokens, which is the concept. The real problem is that a reader who does not know
  what a tokenizer emits reads it as a rendering fault, on a page whose argument is
  precision. Explain it, re-stage it in its own band, or delete it on desktop as was
  already done for phones. *Plane: `COD-407`.*
- [ ] **(P1, L) Something live on every project card, not just a repo link.**
  Counted in `src/constants/projects.js`: **five of the six projects are
  `live_link: null`.** The only one a reader can click is `pb-card-deck`. Note,
  because the ask said "pickleball": `pickleball-vision-llm` is *also* null — the
  one that works is the card deck, not the vision pipeline. The site's argument is
  "results reported as measured", and a repo link asks a recruiter to read code to
  believe it; forty-five seconds is the budget and they will not. **"Live" cannot
  mean the same thing for all five, which is the whole difficulty:** the two RAG
  apps are FastAPI over Ollama/Claude and need a backend Pages cannot host (a
  rate-limited demo host, or a browser-only slice with a prebuilt index — the
  `RetrievalRank` band already proves that is possible); the two vision projects are
  pipelines with nothing to visit (a recorded interaction, a precomputed annotated
  clip, or ONNX/tfjs detection on a sample frame); `instagram-reels-extractor` takes
  third-party input, so a public demo is a terms-of-service problem and the honest
  answer is a fixed pre-extracted sample. Keep **absent beats invented** — a project
  with no honest live artifact keeps `null`. Do this *after* act 4 and the Stack
  restructure, which change the card shape. Related but not the same as act 3, which
  is blocked on screenshots: a demo you can record is a screenshot you can take.
  *Plane: `COD-404`.*

### Done 2026-09-15

- [x] **~~Regenerate `og.png`.~~** It had been previewing a tagline the site no
  longer had. The template is now guarded by a test that fails if it stops
  naming the current role; the render stays manual.
- [x] **~~Guard the JSON-LD and `<noscript>` mirrors.~~** `html-mirror.test.mjs`,
  7 checks, proved to fail three ways.
- [x] **~~Trim the font subsets.~~** 20 woff2 files to 12, vendor CSS 12 kB to
  6.56. Reader transfer is unchanged — the claim that this was worth ~90 kB was
  wrong, and the measurements are in the WORKLOG.

### Found 2026-09-15, measured on the live page

Lighthouse mobile is 100 across accessibility, best practices, SEO and agentic
browsing, so these are what that score cannot see.

- [x] **~~(P1, M) The phone page grew back.~~** Fixed the same day: 9,825px ->
  **8,249px at 390x844, 9.8 screens**, the shortest it has ever been. The
  previous conclusion — "anything further means cutting what is shown" — turned
  out to be a false choice: a disclosure shows less without cutting anything.
  See the WORKLOG entry for 2026-09-15.
- [ ] **(P2, S) `CodeCompletion.jsx` is 515 lines**, past the workspace 500-line
  ceiling; `Works.jsx` is 498, at it. Split by concern, not by line count.

### Done 2026-09-15 (second pass)

- [x] **~~Name the five scene regions.~~** They were five unnamed `region`s in the
  landmark list. `SectionHead` ids its own `<h2>`; `SectionWrapper` points
  `aria-labelledby` at it, so the name is the heading.
- [x] **~~Strip the stage numeral from the Stack group names.~~** The mobile
  variant had the index *inside* the `<h3>`: `heading "Data engineering01"`.
- [x] **~~Nest the degrees under Education.~~** They render through `Role`, so they
  were `h3` beside their own `h3` group heading. `Role` takes `as` now.
- [x] **~~Fix the docs that described the deleted spec band.~~** Five places,
  including the repo README's first sentence and a learning-notes example
  pointing at a file that no longer exists.

### Smaller things worth doing, none of them blocking

- [x] **~~(P2, S) A per-project anchor.~~** Done 2026-09-15, because the phone
  limit made it urgent: About cites `pb-card-deck`, the sixth project, which a
  phone hides. Each card is `id={name}`, About links to it, and a deep link to a
  hidden card opens the deck first. The ask box still links to `#projects`.
- [ ] **(P2, S) Tighten the `llms.txt` guard to whole words.** It matches
  substrings, so renaming `pb-card-deck` to `pb-card-deck-OLD` *in the file* slips
  through. The direction that actually drifts is caught; this closes the other one.
- [ ] **(P2, M) Give `Experience.jsx` a name that matches its section.** The
  section is Roles; the file is still `Experience.jsx`. A rename touches the HOC
  call, the components README and four imports — cheap, but it is a rename, so do
  it deliberately rather than as a tidy-up.
- [x] **~~(P2, S) Drop `react-tilt`.~~** Done 2026-09-15. Total JS 271,791 ->
  270,691 gzipped, seven runtime dependencies to six. The reset lives in
  `:hover` rather than a `pointerleave` handler, so a card cannot stick at an
  angle because an event did not fire. **One follow-up:** the hover was not
  verified visually — touch emulation was browser-wide in that session, so
  `(hover: hover)` never matched. Worth one look on a real desktop pointer.
- [ ] **(P2, M) A contrast check in CI.** `TYPE-AUDIT.md` was measured by hand
  once. The six palettes × the elements that matter is a script, and it would have
  caught the one real finding in that audit before it shipped.

---

## Ship / deploy

- [x] **(P0, S) ~~Push branch + open PR.~~** Done 2026-09-11, squash-merged 2026-09-12 as `630a38f`, branch deleted.
- [~] **(P0, M) Deploy to Vercel.** Zero-config for this Vite app. Yields the
  production URL that unblocks the tickets below. *Blocked 2026-09-11:
  `npx vercel whoami` returns `Logged out` and `vercel login` is interactive, so
  it has to be run by the owner. Deploy from the subdirectory
  (`npx vercel --cwd portfolio`) or set Root Directory to `portfolio` if
  importing the repo in the dashboard: the site is not at the repo root.*
- [x] **(P0, S) ~~Set the real canonical domain.~~** Done 2026-09-11:
  <https://sathishkumarai.github.io/>. The canonical, `og:url`, `og:image`,
  `twitter:image` and the JSON-LD `url`/`image` are the only place the domain is
  hard-coded, and `index.html` says so, so moving to a Vercel address later is
  those lines and nothing else.
- [x] **(P0, M) ~~Deploy to GitHub Pages.~~** Done 2026-09-11: live at
  <https://sathishkumarai.github.io/>, built by Actions in the
  `SathishKumarAI.github.io` repo, which holds no site code. That repo name is
  load-bearing: only `<user>.github.io` serves from the domain root, which keeps
  Vite's `base` at `/` so one build serves both Pages and Vercel.
- [x] **(P0, S) ~~Flip `SOURCE_REF` to `main`.~~** Done 2026-09-12, in the same
  pass as the merge. Pages builds from `main`.
- [x] **(P1, M) ~~Repository protection.~~** Done 2026-09-12: 28 public repos
  refuse force-push and branch deletion and require linear history. 23 private
  repos blocked by plan, 9 forks skipped on purpose. Reasoning, including why an
  enforced PR workflow would lock the owner out on a personal account, is in
  `../../docs/repo/REPO-SECURITY.md`.
- [ ] **(P2, S) Protect the 23 private repos**, which needs GitHub Pro. Or
  decide they do not need it: a private repo is visible only to its owner, so
  the accidental-force-push risk is his alone.
- [ ] **(P2, S) Protect the 9 forks**, if the *Sync fork* button is the only way
  they ever get updated. Skipped because blocking force-push breaks the
  hard-reset-onto-upstream way of syncing one.
- [x] **(P1, S) ~~`sitemap.xml`~~** Declined 2026-09-11, reasoning recorded in
  `portfolio/public/robots.txt`: this is a single page with in-page anchors, so a sitemap
  would carry exactly one URL and tell a crawler nothing it does not already
  have. Reopen the day the site grows real routes.
- [~] **(P1, M) Cross-browser + real-device QA.** Partly done 2026-09-12: the
  owner checked a real phone and it immediately found what nine emulated
  viewports could not — the hero code band flickered, because a mobile browser
  collapses its URL bar as you scroll and the hero is a viewport-height box.
  Fixed. **Safari and Firefox are still completely untested**, and the
  hide-on-scroll handler's iOS rubber-band clamp has still never run on an
  iPhone. This stays the biggest gap on the board.

## Content the owner must supply

- [~] **(P1, M) Real project screenshots / GIFs (option A).** Drop images into
  `portfolio/public/`; layer them over the generative covers for the top 1, 2 projects.
  Highest credibility. *Needs assets from Sathish.*
- [x] **(P1, S) ~~Add EmailJS keys.~~** Dropped 2026-09-11, the contact form
  was removed in favour of a copyable address and an icon row, so there is
  nothing left to key.
- [x] **(P1, S) ~~Confirm LinkedIn slug + contact email.~~** Done 2026-09-11: canonical slug is lowercase `sathishkumarai`, from the owner's own saved profile (72 occurrences, zero for mixed case). HTTP cannot settle it; LinkedIn answers both with 999. Original note: are current (LinkedIn
  blocks bot verification; email deliverability untestable here).
- [~] **(P2, M) Metric covers (option E).** Show a real chart per project
  (retrieval recall, detection mAP, latency). *Needs real numbers: don't fake.*
- [~] **(P2, S) Testimonials.** *Needs real quotes.*

## Features

- [ ] **(P1, L) Per-project detail pages / modals.** problem → approach → result,
  with the "what made it hard" line. Deep dive for recruiters who click in.
- [ ] **(P2, M) Live iframe embed (option D)** for `pickleball-shuffle` (it's live).
- [ ] **(P2, L) Writing / blog section.** Short posts on shipping ML to prod, reinforces the hero thesis.
- [ ] **(P2, S) Résumé / CV download** button in the hero or footer.
- [ ] **(P2, S) "Now" / current-focus line**, what he's building this month.
- [ ] **(P2, M) Hover-reveal on Stack tools**, where each tool was used (link to
  the project that uses it).
- [x] **(P2, S) ~~Rotating / more quotes.~~** Cancelled 2026-09-11: the three interstitial quotes were removed. They were the largest type on the page after the h1, larger than any project title, and sat between the reader and the work.

## Polish

- [x] **(P1, S) ~~Light-mode contrast audit.~~** Done 2026-09-11: the accent's role was split rather than its colour changed. `--c-accent` fills, `--c-accent-ink` reads as text. 22 pairs measured from the built stylesheet, all AA in both themes. Small red text (`#FF3621`) on white
  is ~3.5:1: fine for large headings (AA large), below AA for small body/eyebrow
  text. Consider a darker red token for small text, or navy.
- [x] **(P2, S) ~~Smooth theme transition.~~** Done 2026-09-12. Scoped to the
  moment of the change rather than left on: `.theme-switching` is added to
  `<html>` when the theme changes and removed 260ms later, so the other 99% of
  the session carries no global colour transition — one left on permanently
  would also animate every hover, every active nav link and every reveal. Two
  details that matter: the effect skips its first run, or every reader would
  watch the page assemble its own colours on load; and the reduced-motion
  override is placed AFTER the fade, because the global reset near the top of
  index.css is `!important` too and between two equally important, equally
  specific rules the later one wins.
- [x] **(P2, M) ~~OG / Twitter share image.~~** Done 2026-09-11: `portfolio/public/og.png`
  at 1200x630 plus 180/192/512 icons. Regenerated later the same day when the
  title changed, and given a source: `docs/og-card.html`. It had none, so the
  card kept saying "ML / AI Engineer" after every string on the site had been
  updated, because a grep cannot read a PNG. Still needs absolute URLs at deploy.
- [x] **(P1, M) ~~Legibility / type-size audit.~~** Done 2026-09-11: the page was
  typeset as a dashboard, 137 text elements at 10-11px including every fact a
  recruiter came for. Replaced sixty-four size literals with a named scale in
  `tailwind.config.js`. Two contrast failures fixed (logo monogram 3.62:1, footer
  separator 1.33:1) and three sub-44px touch targets. Full reasoning and
  measurements in `docs/TYPE-AUDIT.md`.
- [x] **~~(P1, M) Shorten the phone page further.~~** 14,494px -> 10,520px ->
  8,967px (2026-09-12) -> 9,825px as campaign copy landed -> **8,249px on
  2026-09-15**, 9.8 screens at 390x844. The first two rounds were deletions: the
  six About capability cards (-480px, they restated Stack) and the Stack chips
  losing their boxes (-233px). The third was not — nothing was deleted. See the
  WORKLOG for why the "anything further means cutting what is shown" conclusion
  recorded here was wrong.
- [ ] **(P2, S) A theme picker on first load** was proposed and advised against:
  the site already reads `prefers-color-scheme`, so a modal asks a question the
  OS has answered and puts a decision between a recruiter and the content. If it
  is still wanted, build it as an inline strip in the hero, not a dialog.
- [x] **(P2, S) ~~Delete `Quote.jsx`.~~** Done 2026-09-12. Dead since the
  interstitial quotations were removed. Confirmed before deleting: no reference
  anywhere in `portfolio/src/`, and the built bundle contained zero occurrences of its
  `figcaption` — Rollup had already tree-shaken it, so the deletion changes the
  shipped output not at all and is purely about the reader of the source.
- [x] **(P2, S) ~~Section-header treatment.~~** Done 2026-09-12: the eyebrow now
  carries a derived fact (`4 roles · since 2020`, `6 areas · 33 tools`,
  `6 built · 1 live`, `4 routes · US Central`) instead of a label that repeated
  the nav, and the trailing full stops are gone. `SectionHead.jsx` owns the
  shape. Every number is computed from the data, so none can go stale.

## Engineering

- [ ] **(P2, M) Reduce framer-motion footprint**, it's the largest runtime dep
  (~37KB gzip). Replace simple reveals/hovers with CSS where possible.
- [ ] **(P2, S) Preload the primary font weights** (Barlow 400/700) to cut FOUT.
- [x] **(P2, S) ~~CI: build + lint on PRs.~~** Done 2026-09-12,
  `.github/workflows/ci.yml`. Runs the same install / lint / build / crawler-file
  guard the deploy runs, on the same Node 22, so CI and deploy cannot disagree
  about what green means. A Lighthouse budget was **not** included: it needs a
  hosted URL per PR to be meaningful, and this repo has no preview deploys.
  Reopen it if Vercel previews ever land.
- [ ] **(P1, L) Prerender for AI crawlers.** The site is a client-rendered SPA,
  so ChatGPT-User, GPTBot and most AI crawlers see only the `<noscript>` block:
  they do not execute JavaScript. `portfolio/public/llms.txt` is the deliberate answer and
  covers the content, but the HTML itself is empty to them. A build-time
  prerender (one plugin, one build step) would give them the real page. Weigh
  against the cost of a new dep and a second render path. This is a
  rearchitecture, not a refinement, which is why it was flagged rather than
  started.
- [ ] **(P2, S) Keep `llms.txt` and the JSON-LD honest.** Both are hand-written
  copies of facts that live in `portfolio/src/constants/index.js`, and both now carry a
  comment naming the constant they mirror. A small check that fails when
  `stackGroups` or `education` drifts from them would make the comment
  enforceable instead of aspirational.

---

_See `docs/WORKLOG.md` for what's already shipped._
