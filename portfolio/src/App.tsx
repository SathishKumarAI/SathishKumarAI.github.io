/* ---------------------------------------------------------------------------
   PLAIN ENGLISH.

   The composition root: the only file that says WHAT IS ON THE PAGE AND IN
   WHAT ORDER. Nothing here has logic of its own — every element below is a
   component that owns its own behaviour. If you are looking for why a section
   renders the way it does, this file will not tell you; it will tell you
   which file to open.

   Reading the JSX top to bottom gives you the page top to bottom, with two
   deliberate exceptions worth knowing:

     - The fixed layers (`NeuralField`, the grain, the rails, `BackToTop`,
       `ScrollDown`, `CommandPalette`) sit outside `<main>` and are positioned,
       so their
       place in this file is paint order, not page order.
     - `AgentNote` and `Footer` come AFTER `</main>` because a page gets one
       main landmark and they are not part of it.

   TO REORDER THE PAGE, move a line inside `<main>`. Two things follow
   automatically and one does not: the nav and the right rail both read
   `navLinks` in `constants`, so they stay correct, but the scene tinting is
   `main > section:nth-of-type(even)` in `index.css` — moving a section
   changes which ones are tinted.
--------------------------------------------------------------------------- */
import { MotionConfig } from "framer-motion";
import { About, Contact, Hero, Navbar, Tech, Works } from "./components";
import Experience from "./components/Experience";
import Footer from "./components/Footer";
import ScrollProgress from "./components/ScrollProgress";
import BackToTop from "./components/BackToTop";
import ScrollDown from "./components/ScrollDown";
import ErrorBoundary from "./components/ErrorBoundary";
import CommandPalette from "./components/CommandPalette";
import SideRail from "./components/SideRail";
import ContactRail from "./components/ContactRail";
import AgentNote from "./components/AgentNote";
import Collaborate from "./components/Collaborate";
import NeuralField from "./components/NeuralField";
import FieldLegend from "./components/FieldLegend";

function App() {
  return (
    <ErrorBoundary>
      {/* The CSS reduced-motion block only covers CSS animation; every
          framer-motion animation on the page is JS-driven and ignored it. */}
      <MotionConfig reducedMotion="user">
        <div className="relative z-0 bg-primary">
          {/* Behind everything: reads the two docks as input and output layers.
              Sections sit later in the DOM at the same z, so they paint over it. */}
          <NeuralField />
          {/* Over everything, under nothing that matters: a fixed noise layer at
              3.5% so a flat dark ground stops banding and starts reading as a
              material. See `.grain` in index.css. */}
          <span aria-hidden="true" className="grain" />
          <ScrollProgress />
          {/* Targets #main, not #about, the old target skipped the whole hero, the h1, the pitch and both CTAs. The .hash-span ids are
              non-focusable spans, so tabIndex={-1} on <main> is what actually
              moves the focus point. */}
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Navbar />
          <main id="main" tabIndex={-1}>
            <div className="hero-bg bg-cover bg-no-repeat bg-center">
              <Hero />
            </div>
            <About />
            <Experience />
            <Tech />
            <Works />
            <Contact />
            {/* Last on the page, and desktop only. It is a closing note rather
                than a section someone came for, and on a phone it is in the
                menu instead. Inside <main>, not after it: a page gets one main
                landmark, and an earlier version split it in two. */}
            <Collaborate />
          </main>
          <AgentNote />
          <Footer />
          <SideRail />
          <ContactRail />
          {/* Explains the two rails above it: they are the field's input and
              output layers. Desktop only, like the field and the docks. */}
          <FieldLegend />
          <BackToTop />
          <ScrollDown />
          <CommandPalette />
        </div>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
