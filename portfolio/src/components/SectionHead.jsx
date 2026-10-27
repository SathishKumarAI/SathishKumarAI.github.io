import { motion } from "framer-motion";
import { styles } from "../styles";
import { textVariant } from "../utils/motion";

/**
 * Owns, how a section announces itself.
 * Does not own: what any section says. Each one passes its own `meta`, computed
 * from its own data, because a number belongs next to the thing it counts.
 *
 * ## Why this exists
 *
 * Five sections opened identically: a mono eyebrow, then the section name with
 * a full stop after it. "WHERE I'VE WORKED / Experience.", "SELECTED WORK /
 * Projects.", "GET IN TOUCH / Contact." Two things were wrong with that.
 *
 * **The eyebrow carried no information.** "Selected work" above "Projects"
 * tells a reader nothing the nav did not already tell them, so five times on
 * the way down the page they read a line that costs attention and returns
 * nothing.
 *
 * **Uniform openings read as generated.** When every section announces itself
 * with the same two-line shape and the same trailing full stop, the page reads
 * as filled-in rather than written, whatever the quality of what follows.
 *
 * So the eyebrow now carries a fact, and the facts are derived, never typed:
 * four roles because `experience` has four, and the tool count because that is
 * the size of the set (`TOOL_COUNT`, derived in constants/stack.js). They cannot go stale, and they are the kind of claim
 * this page is otherwise built on — the hero promises evidence, and this is the
 * cheapest possible instance of it. The shapes differ from each other because
 * the numbers do.
 *
 * The full stop is gone. A one-word heading with a period after it is a house
 * style borrowed from a hundred agency templates; without it the heading is
 * just the heading.
 *
 * `meta` is optional, and About deliberately passes none: the first section
 * sets no pattern for the others to repeat, and there is no honest number to
 * put over an introduction.
 */
const SectionHead = ({ title, meta }) => (
  <motion.div variants={textVariant()} className="mb-[clamp(1.5rem,3vw,2.75rem)]">
    {/* The rule before the meta is the spec-sheet tell: it turns a line of
        derived facts into a label for the scene rather than a caption under
        nothing. Same device as the hero's three claims, same 20px rule. */}
    {meta && (
      <p className={`flex items-center gap-3 ${styles.sectionSubText}`}>
        <span aria-hidden="true" className="h-px w-5 shrink-0 bg-accent/70" />
        {meta}
      </p>
    )}
    {/* The id is what `SectionWrapper` points `aria-labelledby` at, so a
        screen reader announces "About, region" instead of five unnamed ones.
        Derived from the title rather than passed in, because the section id,
        the nav label and this heading are already required to be the same word
        — `test_every_cited_section_is_a_real_one` enforces it. */}
    <h2 id={`${title.toLowerCase()}-title`} className={`mt-3 ${styles.sectionHeadText}`}>
      {title}
    </h2>
  </motion.div>
);

export default SectionHead;
