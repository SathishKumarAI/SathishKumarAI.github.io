/**
 * Owns, the closing rule under the page, colophon only.
 * Does not own: navigation or contact links. Both sit above it and repeating
 * them here was the duplication this footer used to be made of.
 */
import LiveClock from "./LiveClock";
import { styles } from "../styles";
import { SITE_REPO } from "../constants";

// One date convention across the site: "Month YYYY", the same shape the
// Experience timeline prints. The old "2026.09" was the only place using
// YYYY.MM, which made it the odd one out on its own page.
const STARTED = "August 2024";
const THIS_VERSION = "October 2026";

/**
 * THE COLOPHON NAMES THE BUILD, not just the typefaces.
 *
 * A portfolio that argues for measured, boring, reproducible tools and then
 * declines to say what it was itself built with is being coy about the one
 * system the reader can actually inspect. The repository is public; the stack
 * is a fact either way, so stating it costs nothing and saves a curious reader
 * a trip to package.json.
 *
 * Read off the real dependencies rather than remembered: React and Vite build
 * it, Tailwind styles it, framer-motion moves it, three.js draws the hero.
 * If one of these is dropped, this line is wrong in the same commit.
 *
 * A LIST, not a string. It used to be one pre-joined sentence, which let the
 * browser break inside a word: at 390px `framer-motion` hyphenated across two
 * lines as "framer-" / "motion". Each term is now its own non-breaking unit,
 * so a wrap can only ever happen between terms.
 */
const BUILT_WITH = ["React", "Vite", "Tailwind", "framer-motion", "three.js"];
const SET_IN = ["Barlow", "Newsreader", "JetBrains Mono"];

/**
 * A run of terms separated by interpuncts.
 *
 * THE SEPARATOR LEADS ITS TERM rather than trailing the one before it. When
 * the dot trailed, a wrap could leave it stranded at the end of a line — at
 * 390px the licence row read "Code MIT ↗ ·" and then "Build your own ↗" on
 * the next line, with the dot pointing at nothing. Binding each dot to the
 * term that follows it means a line can never end on a separator.
 */
const Terms = ({ children }) => (
  <>
    {children.map((item, i) => (
      <span key={i} className="whitespace-nowrap">
        {i > 0 && <span className="text-faint opacity-50"> · </span>}
        {item}
      </span>
    ))}
  </>
);

/**
 * One label/value pair of the colophon.
 *
 * NOT A FLEX ITEM ANY MORE, and that is the whole change. The four groups used
 * to be `flex flex-wrap`, which lets each one size to its own content: at
 * 1440px they wrapped two-and-two, and because the groups are different
 * widths, the second row's labels began nowhere near the first row's. Four
 * facts, four starting edges, nothing for the eye to follow down. The report
 * was that it looked scattered, and the punctuation was never the reason.
 *
 * They are now cells of one grid, so every value in a column starts on the
 * same pixel. `display: contents` lets this component stay a component while
 * its two children become direct grid cells of the parent.
 *
 * NO LOGOS HERE, deliberately. The brand marks live in a lazily-loaded chunk
 * precisely so 17kB of SVG paths stay out of the entry bundle, and the footer
 * renders on every page load. Pulling that chunk forward to decorate a
 * colophon would cost every reader first paint for ornament. No emoji either:
 * nothing else on this page uses them, and a row of them under a type-led
 * design reads as a different site's footer.
 */
const Group = ({ label, children }) => (
  <div className="contents">
    <dt className="font-mono text-micro uppercase tracking-[0.14em] text-faint opacity-70 sm:pt-px">
      {label}
    </dt>
    <dd className="mt-0.5 mb-3 text-secondary sm:my-0">{children}</dd>
  </div>
);

const Footer = () => (
  // Gutter on the <footer>, measure inside it — the split `SectionWrapper`
  // uses. `px-6 sm:px-16` used to sit on the capped div, which parked the
  // colophon 64px to the right of every section heading above it on any
  // viewport past 1280px. `sm:pr-24` stays on the measure: it is clearance for
  // the fixed BackToTop button, not a gutter.
  <footer className={`${styles.paddingX} relative z-10 border-t border-line bg-primary`}>
    <div className="max-w-7xl mx-auto pt-5 pb-20 sm:py-5 sm:pr-24 font-mono text-label text-faint">
      {/* ONE GRID, three shapes, and each is chosen from what the content
          needs at that width rather than from a breakpoint habit.

            base   label above value, full width. The value line is the whole
                   measure, which is what `React · Vite · Tailwind ·
                   framer-motion · three.js` needs at 390px. The previous
                   two-column layout gave it half of that and it broke twice.
            sm     label left, value right, four rows. One value edge.
            xl     two pairs per row, two rows. Only here, because at 1024px
                   four columns squeezes the build list back into two lines
                   and the four-row version is cleaner. */}
      <dl
        className="grid grid-cols-1 gap-x-6
                   sm:grid-cols-[max-content_minmax(0,1fr)] sm:gap-y-2.5
                   xl:grid-cols-[max-content_minmax(0,1fr)_max-content_minmax(0,1fr)] xl:gap-x-10"
      >
        <Group label="Built with">
          <Terms>{BUILT_WITH}</Terms>
        </Group>
        <Group label="Set in">
          <Terms>{SET_IN}</Terms>
        </Group>
        <Group label="Licence">
          {/* "Code MIT", never a bare MIT badge: the written content is not
              covered, and a badge would erase the distinction. */}
          <Terms>
            {[
              <a
                key="mit"
                href={`${SITE_REPO}/blob/main/LICENSE`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center min-h-11 sm:min-h-0 text-accent-ink hover:underline"
              >
                Code MIT ↗
              </a>,
              <a
                key="build"
                href={`${SITE_REPO}/blob/main/docs/prompts/BUILD-THIS-YOURSELF.md`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center min-h-11 sm:min-h-0 text-accent-ink hover:underline"
              >
                Build your own ↗
              </a>,
            ]}
          </Terms>
        </Group>
        <Group label="Since">
          <Terms>{[STARTED, `this version ${THIS_VERSION}`]}</Terms>
        </Group>
      </dl>

      {/* The signature, last and on its own full-width line. It used to be a
          flex sibling of the groups, holding a column too narrow for it: at
          1440px `© 2026 Sathish Kumar · CDT 00:13 · yours · EDT 01:13 · IST
          10:43` wrapped onto three lines and split a time across two of them,
          while a third of the footer to its right stayed empty. Given the
          width it never needed much of, it is one line everywhere above a
          phone.

          AND STACKED ON A PHONE, where one line does not fit. Joined by an
          interpunct at 390px the two halves wrapped anyway and left the dot
          stranded at the end of the first line — the same orphan the `Terms`
          separator was changed to avoid. A line break separates them well
          enough and needs no punctuation to do it. */}
      <p className="mt-4 flex flex-col gap-y-0.5 border-t border-line/60 pt-3 sm:mt-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
        <span>© {new Date().getFullYear()} Sathish Kumar</span>
        <span aria-hidden="true" className="hidden text-faint opacity-50 sm:inline">
          ·
        </span>
        <LiveClock />
      </p>
    </div>
  </footer>
);

export default Footer;
