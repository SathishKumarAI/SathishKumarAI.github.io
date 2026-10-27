/* ---------------------------------------------------------------------------
   PLAIN ENGLISH.

   The moving network behind the hero, drawn with real 3D (three.js) on a
   graphics card. Points are the neurons, lines are the connections, and the
   little bright dots travelling along them are activations.

   It is a DIAGRAM, not wallpaper. The contact icons down the left edge ARE the
   input layer and the section dots down the right ARE the output layer — not
   "points drawn on top of them", which is what this used to say and used to do.
   No node is drawn at either end now: the edges run to the controls' own edges
   and stop, because a dot painted underneath an opaque tile is a dot nobody can
   see, and drawing one there quietly said the icon was not the node after all.

   The coordinates are read from the real buttons every time anything moves, so
   the drawing cannot drift from the interface it describes.

   This file is ~131 kB gzipped once three.js is counted — about four times the
   whole app — which is why NeuralField.jsx only `import()`s it for a desktop
   reader who has not asked for reduced motion and whose browser grants WebGL.
   Everyone else gets the 2D version and never downloads this.

   Walked through slowly: docs/LEARNING-NOTES.md, section 5.
--------------------------------------------------------------------------- */
/**
 * Owns: the hero field as an actual 3D scene, rendered with three.js.
 *
 * Not a component. `NeuralField` decides whether this applies and hands it the
 * same canvas; everything here is plain DOM and WebGL, and `start()` returns
 * the function that tears it down. Keeping it out of React is what lets it be
 * `import()`-ed, which is the whole reason the weight is affordable: this file
 * and the three.js it pulls in are one 522.79kB chunk, 131.13kB gzipped, and a
 * phone, a reader who asked for reduced motion, and a browser with no WebGL
 * never request it at all. Verified in the network panel against the built
 * bundle, not assumed from the config.
 *
 * WHAT IT DRAWS, AND WHY IT IS STILL A DIAGRAM
 *
 * The same claim the 2D field makes, with the one thing 2D could not give it.
 * The input layer sits on the real contact dock and the output layer on the
 * real section rail — coordinates read from `getBoundingClientRect()`, not
 * invented — and both of those planes are at z = 0. The two hidden layers are
 * pushed toward the reader and away from them, so the network is a volume
 * between two fixed columns of the interface rather than a flat lattice
 * behind it. Moving the pointer moves the camera, and the parallax is the
 * point: depth you cannot see is depth you did not need.
 *
 * That depth cost the diagram its accuracy for as long as it existed, because
 * `toWorld` mapped a pixel to a world point correctly ONLY at z = 0. Every
 * hidden node was computed in pixels and then silently rescaled by perspective
 * on the way to the screen: the near layer by 1.21x, the far one by 0.84x. The
 * labels were placed from the pixel values, so each one named a column that
 * was not there — HIDDEN 1's label sat at x=512 while its nodes drew at
 * x=460-465, and the "column" fanned 4.8px top to bottom. `toWorld` now
 * divides by the same factor the projection will multiply by, which cancels
 * it: measured through the real camera, every column projects to its label's
 * pixel with a fan of 0.00px.
 *
 * And the reader is TOLD none of this. An activation lights the real control
 * it leaves and the real control it arrives at, so the claim is demonstrated
 * on something they recognise rather than asserted in a caption.
 *
 * Activations travel as a LAYER WAVE: one gap at a time, every edge crossing
 * it carrying at once. A layer in an MLP is a single matrix multiply, so every
 * unit of layer k+1 reads every unit of layer k simultaneously — there is no
 * path through one unit per layer, which is what this used to draw and which
 * read as each layer waiting its turn. In 3D the front travels through the
 * page rather than across it.
 *
 * THE COST, STATED PLAINLY
 *
 * `NeuralField`'s own header used to argue against exactly this: "three.js plus
 * a renderer is ~150kB gzip against a ~115kB bundle". That was true and is
 * still true; the decision was reversed deliberately, by the owner, after being
 * shown the number. What keeps it honest:
 *
 *  - dynamically imported, so it is a separate chunk nothing else waits on
 *  - never requested below 1024px, under reduced-motion, or without WebGL
 *  - one renderer, one scene, no post-processing, no textures, no shadows
 *  - `powerPreference: "low-power"`, antialias off, DPR capped at 1.5
 *  - the loop stops when the hero leaves the screen and when the tab hides
 *  - 110 edges at a tenth of the alpha, and at most one forward pass in
 *    flight — 48 dots at the widest gap, none at all between passes; geometry
 *    is rebuilt when the interface moves, never per frame
 */

/**
 * Named imports, not `await import("three")` inside `start()`. A namespace
 * object has to carry every export, so the namespace form shipped the whole
 * library: 191.81kB gzipped. Naming the ten classes this scene actually uses
 * lets Rollup drop the rest — loaders, every material but two, the animation
 * system, the audio and XR code — and this module is itself dynamically
 * imported by NeuralField, so the shaken result is still a lazy chunk.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  LineBasicMaterial,
  LineSegments,
  NormalBlending,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";

// The shape and the layer names are shared with the 2D field: see netShape.js
// for why they stopped being declared twice.
import {
  HIDDEN, LAYERS, FIRE_MS, HOP_SECONDS, REST_SECONDS,
  FIELD_ALPHA, alphaFor, EDGE_REST, EDGE_LIT, HIDDEN_SPREAD, inkToken, edgesFor,
  PASS_BUDGET,
} from "./netShape";

const HIDDEN_DEPTH = [170, -190]; // toward the reader, then away
/**
 * Ceiling on dots drawn in one frame, which is the widest GAP rather than a
 * budget of independent activations: a forward pass carries every edge of one
 * gap at once.
 *
 * Fully connected, the widest gap is HIDDEN 1 -> HIDDEN 2 at 8 x 6 = 48. The
 * old value of 32 was sized for the sparse lattice and would now clip sixteen
 * edges out of every second hop -- silently, because `stepSignals` draws
 * `min(gap.length, MAX_SIGNALS)` rather than throwing. 64 leaves room for the
 * shape in netShape.js to be retuned without that happening again, and
 * `netshape.test.mjs` fails if a gap ever outgrows it.
 */
const MAX_SIGNALS = 64;

const FOV = 50;

/**
 * EDGE_REST / EDGE_LIT live in netShape.js, because the 2D field animates the
 * same forward pass and the two must not drift.
 *
 * Edges are vertex-coloured rather than uniformly tinted, which is what lets a
 * pass LIGHT THE WIRES it is crossing instead of only sending dots along them.
 * Mixing toward the page colour, rather than varying alpha per vertex, is what
 * makes that work on light and dark grounds with one code path: a vertex
 * colour can be interpolated, a material's alpha cannot.
 */

/**
 * A soft round sprite for the nodes and the activations.
 *
 * `PointsMaterial` with no map draws a hard square, which is what made the
 * hidden units read as dust rather than as anything lit. A radial falloff
 * costs one 64px canvas, uploaded once, and turns every point into a glow with
 * a defined core — the difference between a diagram that looks rendered and
 * one that looks plotted.
 */
const softDot = () => {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  // A bright core that holds its shape, then a long tail. A linear falloff
  // reads as a blurred blob; this reads as a point with light around it.
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.22, "rgba(255,255,255,0.92)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.28)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  return new CanvasTexture(c);
};

const rgb = (root, name) => {
  const v = getComputedStyle(root).getPropertyValue(name).trim().split(/\s+/).map(Number);
  return v.length === 3 && v.every((n) => Number.isFinite(n)) ? v : [128, 128, 128];
};

const shown = (el) => {
  const s = getComputedStyle(el);
  if (s.display === "none" || s.visibility === "hidden") return false;
  const b = el.getBoundingClientRect();
  return b.width > 0 && b.height > 0;
};

/**
 * The point on a control's edge that FACES the network, plus 6px of air.
 *
 * It used to be the control's centre, which put every input and output node
 * directly underneath an opaque glass tile at `z-40` while the canvas sits at
 * `z-0`. Nine nodes were drawn per frame where nothing could see them, and the
 * edges leaving them vanished under the tile a third of the way out, so the
 * lattice read as floating near the dock rather than as wired to it.
 *
 * Anchoring to the edge instead means the line starts where the tile stops:
 * the control itself is the node, which is the claim the drawing has always
 * been making. `dir` is +1 for the left dock (the network is to its right) and
 * -1 for the right rail.
 */
const port = (el, dir) => {
  const b = el.getBoundingClientRect();
  return {
    x: dir > 0 ? b.right + 6 : b.left - 6,
    y: b.top + b.height / 2,
    el,
  };
};

export const start = (anchor) => {
  const root = document.documentElement;

  /**
   * Its own canvas, not the one NeuralField renders. A canvas keeps the first
   * context it is given for life, and `forceContextLoss()` on teardown poisons
   * it for the next renderer — which React's development double-mount does
   * immediately, and which produced exactly one symptom: "THREE.WebGLRenderer:
   * Cannot read properties of null (reading 'precision')" and a blank field.
   * A fresh element per start() cannot collide with anything.
   */
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  // No opacity class: `FIELD_ALPHA` carries the quietness now, and the
  // canvas's own opacity belongs to the scroll fade alone. See netShape.js.
  canvas.className = "pointer-events-none fixed inset-0 z-0";

  /**
   * Mounted NEXT TO the 2D canvas, not on <body>.
   *
   * `document.body.appendChild` put the field ON TOP OF THE ENTIRE PAGE.
   * `#root` is `position: static; z-index: auto`, so it paints in the normal
   * flow; this canvas is `position: fixed; z-index: 0` and a LATER sibling of
   * it, and a positioned element at level 0 paints above static content. Every
   * edge therefore crossed the headline, the navbar and the buttons instead of
   * passing behind them.
   *
   * It went unnoticed for as long as the field was invisible: at the old
   * effective alpha of 0.077 there was nothing to see on top of anything. The
   * moment the edges became legible, so did the mistake.
   *
   * `anchor` is the 2D canvas, which React renders as the first child of the
   * app container -- exactly the right place, which is why the 2D field never
   * had this bug. Inserting before it inherits that position: above the
   * container's own background, below every sibling that holds content.
   */
  const mount = anchor?.parentElement ?? document.body;
  mount.insertBefore(canvas, anchor ?? null);

  let w = window.innerWidth;
  let h = window.innerHeight;

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  // 1.5, not 2. This is a field of 1px points and hairlines behind text: the
  // third pixel of a retina backing store is invisible here and costs 78% more
  // fragments than 1.5 does.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, w / h, 1, 5000);

  /**
   * One world unit = one CSS pixel at z = 0. That is the only reason the input
   * layer can land exactly on the contact icons: the dock's rect is in pixels,
   * and with the camera pulled back to (h/2) / tan(fov/2) a pixel offset from
   * the centre of the screen is the same number in world space.
   */
  const fit = () => {
    camera.aspect = w / h;
    camera.position.z = h / 2 / Math.tan((FOV / 2) * (Math.PI / 180));
    camera.updateProjectionMatrix();
    /**
     * `true` — let three.js write `style.width/height`. This argument is
     * `updateStyle`, and passing `false` is what broke the whole field on any
     * display with a devicePixelRatio above 1.
     *
     * A <canvas> is a REPLACED element. `position: fixed; inset: 0` does not
     * stretch one: with `width: auto` it falls back to its INTRINSIC size,
     * which is the `width`/`height` attributes — and those are the drawing
     * buffer, which `setPixelRatio` multiplies by the DPR. So on a 1.5x
     * display a 1601x883 viewport got a canvas laid out at 2401x1324 CSS
     * pixels, anchored top-left and overflowing the screen by 800px across.
     *
     * The scene inside it was then magnified 1.5x from the top-left corner.
     * The input layer landed at CSS x=99 against a dock at 66, and the output
     * layer at roughly x=2302 against a rail at 1520 — three quarters of the
     * diagram was off the right-hand edge of the screen.
     *
     * At DPR 1 the buffer equals the viewport and everything is exactly right,
     * which is why this shipped and survived. The 2D fallback never had it: it
     * sets `c.style.width` itself.
     */
    renderer.setSize(w, h);
  };

  /** Camera distance to the z = 0 plane. `fit()` keeps `camera.position.z` here. */
  const camDist = () => h / 2 / Math.tan((FOV / 2) * (Math.PI / 180));

  /**
   * A screen pixel to a world point, AT ANY DEPTH.
   *
   * The old version was `new Vector3(p.x - w / 2, h / 2 - p.y, z)` — correct
   * at z = 0 and wrong everywhere else, which is the bug that stopped this
   * being a diagram.
   *
   * A perspective camera at distance `d` projects a point at depth `z` to
   * `offset * d / (d - z)`. At z = 0 that is the identity, which is why the
   * two anchored layers always landed exactly on their docks and nobody
   * noticed the rest. The hidden layers sit at z = +170 and z = -190, so the
   * near one was magnified 1.21x and the far one shrunk to 0.84x: the careful
   * pixel coordinates were computed, then scaled away before they reached the
   * screen. Measured at 1512x900 — the HIDDEN 1 label sat at x=512 while its
   * nodes projected to x=460-465, and the column FANNED, top to bottom, by
   * 4.8px.
   *
   * Dividing by that factor on the way in cancels it on the way out, so a
   * node lands on the pixel it was computed from whatever depth it is at. The
   * depth is still real: points still attenuate with distance, edges still
   * foreshorten, the parallax still moves the volume. Only the lie is gone.
   */
  const toWorld = (p, z = 0) => {
    const s = (camDist() - z) / camDist();
    return new Vector3((p.x - w / 2) * s, (h / 2 - p.y) * s, z);
  };

  // --- materials, coloured from the live theme tokens -----------------------
  const dot = softDot();

  /**
   * Sizes are up sharply because a soft sprite is mostly falloff: a 5px hard
   * square and a 5px glow are not the same amount of visible mark. These are
   * the sizes at which the core reads as a node and the halo as light.
   */
  const nodeMat = new PointsMaterial({
    map: dot, size: 19, sizeAttenuation: true, transparent: true,
    opacity: FIELD_ALPHA.node, depthWrite: false,
  });
  /**
   * Vertex-coloured, so the forward pass can light the gap it is crossing.
   * The alpha stays uniform on the material and the INTENSITY rides on the
   * colour, mixed between the page colour and the ink token — the one
   * formulation that behaves on a near-black and a near-white ground without
   * branching. See EDGE_REST.
   */
  const edgeMat = new LineBasicMaterial({
    transparent: true, vertexColors: true,
    opacity: FIELD_ALPHA.edge, depthWrite: false,
  });
  /**
   * `vertexColors` so each activation can fade IN as it leaves a layer and OUT
   * as it lands, instead of appearing and vanishing on a frame. A dot that
   * pops is the single thing that made the pass read as mechanical.
   */
  const signalMat = new PointsMaterial({
    map: dot, size: 26, sizeAttenuation: true, transparent: true,
    vertexColors: true, opacity: FIELD_ALPHA.signal, depthWrite: false,
  });

  const paintTheme = () => {
    const scheme = root.getAttribute("data-scheme") === "light" ? "light" : "dark";
    const [r, g, b] = rgb(root, inkToken(scheme));
    const [ar, ag, ab] = rgb(root, "--c-accent");
    nodeMat.color.setRGB(r / 255, g / 255, b / 255);
    signalMat.color.setRGB(ar / 255, ag / 255, ab / 255);

    /**
     * Blending is picked from the SCHEME, not the theme.
     *
     * Additive light is how a glow works on a dark ground: overlapping halos
     * accumulate and the field reads as lit. On a white page additive is the
     * one blend that cannot work — adding toward white on white erases the
     * mark entirely, so every node would vanish on `light`, `paper`, `clean`
     * and `sepia`. Those four take normal blending and read as ink instead.
     */
    const light = scheme === "light";
    const blending = light ? NormalBlending : AdditiveBlending;
    nodeMat.blending = blending;
    signalMat.blending = blending;

    const a = alphaFor(light ? "light" : "dark");
    nodeMat.opacity = a.node;
    edgeMat.opacity = a.edge;
    signalMat.opacity = a.signal;

    paintEdges();
  };

  /* One container, reused, mounted beside the canvas for the same stacking
     reason -- on <body> these captions painted over the page too.

     The note that used to sit here warned that a `fixed` element inside a
     TRANSFORMED ancestor is positioned against that ancestor rather than the
     viewport. True in general, and checked here rather than assumed: the chain
     from the app container up through #root to <body> carries no transform,
     filter, perspective, will-change or contain, so nothing traps it. If one
     is ever added, this and the canvas both move back out. */
  const labelBox = document.createElement("div");
  labelBox.setAttribute("aria-hidden", "true");
  labelBox.className = "pointer-events-none fixed inset-0 z-0 opacity-70";
  mount.insertBefore(labelBox, anchor ?? null);

  let nodes = null;   // Points
  let edges = null;   // LineSegments
  let layers = [];    // Vector3[][]
  // hops[k] = every [from, to] edge crossing the gap from layer k to k+1. A
  // forward pass carries one whole gap at a time, so this is the unit the
  // animation works in -- the flat `pairs` list is only what the geometry wants.
  let hops = [];      // [Vector3, Vector3][][]
  // Where each hop's vertices live inside the one edge geometry, so a gap can
  // be re-coloured without rebuilding anything. { start, count } in vertices.
  let hopVerts = [];
  // Last built signature of the interface, so the 500ms poll can tell "nothing
  // moved" from "rebuild everything". See the guard in build().
  let lastSig = "";

  /**
   * Colour every edge for the current state of the pass.
   *
   * Each vertex is set to a mix between the PAGE colour and the ink token, so
   * intensity 0 is invisible and 1 is a full-strength wire. The gap the front
   * is crossing rides up to `EDGE_LIT` on a sine, which peaks as the front
   * reaches the middle of the gap and settles back as it lands — the wires
   * carry the signal rather than merely hosting a dot that slides along them.
   *
   * Called on theme change, on rebuild, and once per frame while a pass is in
   * flight. 72 vertices; the cost is a buffer upload, not a recompute.
   */
  const paintEdges = () => {
    if (!edges || !hopVerts.length) return;
    const attr = edges.geometry.getAttribute("color");
    if (!attr) return;
    const bg = rgb(root, "--c-primary");
    const ink = rgb(root, inkToken(root.getAttribute("data-scheme") === "light" ? "light" : "dark"));
    hopVerts.forEach((range, i) => {
      let t = EDGE_REST;
      if (wave && wave.hop === i) {
        t = EDGE_REST + (EDGE_LIT - EDGE_REST) * Math.sin(Math.PI * Math.min(1, wave.t));
      }
      const r = (bg[0] + (ink[0] - bg[0]) * t) / 255;
      const g = (bg[1] + (ink[1] - bg[1]) * t) / 255;
      const b = (bg[2] + (ink[2] - bg[2]) * t) / 255;
      for (let v = range.start; v < range.start + range.count; v++) attr.setXYZ(v, r, g, b);
    });
    attr.needsUpdate = true;
  };
  // The real controls behind the first and last layer, index-aligned with
  // `layers[0]` and `layers.at(-1)`. Kept beside the geometry rather than on
  // it because a Vector3 is a Vector3 and hanging a DOM node off one is the
  // kind of thing that survives until someone clones the array.
  let ends = { in: [], out: [] };

  const disposeGraph = () => {
    for (const obj of [nodes, edges]) {
      if (!obj) continue;
      scene.remove(obj);
      obj.geometry.dispose();
    }
    nodes = edges = null;
  };

  /**
   * Read the live interface and rebuild the graph. Called on resize and on a
   * 500ms poll — never per frame. A dock that hides itself removes its nodes,
   * the same rule the 2D field follows, because a diagram wired to controls
   * that are not there is a drawing of something else.
   */
  const build = () => {
    const inputs = [...document.querySelectorAll(
      'nav[aria-label="Contact shortcuts"] a, nav[aria-label="Contact shortcuts"] button'
    )].filter(shown).map((el) => port(el, 1));
    const outputs = [...document.querySelectorAll('nav[aria-label="Sections"] a')]
      .filter(shown).map((el) => port(el, -1));
    // `labelLayers()` BEFORE the return, not after it. This guard used to exit
    // straight out, which disposed the graph and left the four labels standing:
    // at 882px both docks are `display:none`, so there is no network at all and
    // "INPUT 4" and "HIDDEN 1 8" were still painted across the bottom of the
    // page, captioning nothing. The other two sat at left:987px and left:1458px
    // on an 882px viewport — off the side of the screen entirely.
    if (!inputs.length || !outputs.length) {
      disposeGraph();
      layers = [];
      hops = [];
      lastSig = "";
      // A pass in flight refers to Vector3s from the graph just thrown away.
      wave = null;
      ends = { in: [], out: [] };
      labelLayers();
      return;
    }
    /**
     * NOTHING MOVED? THEN DO NOTHING.
     *
     * The poll calls this twice a second whether or not the interface changed,
     * which used to be merely wasteful — it rebuilt two BufferGeometries and
     * re-made four label elements per second for a picture that was already
     * correct. It stopped being merely wasteful when a forward pass became a
     * thing with state: `build()` has to drop a wave in flight, because that
     * wave holds Vector3s from the graph being replaced, and a pass takes
     * ~3.5s. A rebuild every 0.5s meant no pass ever survived to reach the
     * output layer. Measured before this guard: the input dock fired every
     * ~500ms and the section rail never fired once in nine seconds.
     *
     * The signature is every anchor's rounded position plus the viewport, which
     * is exactly the set of things the geometry is derived from.
     */
    const sig = `${w}x${h}|${[...inputs, ...outputs]
      .map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(" ")}`;
    if (sig === lastSig && layers.length) return;
    lastSig = sig;

    ends = { in: inputs.map((p) => p.el), out: outputs.map((p) => p.el) };

    const x0 = inputs[0].x, x1 = outputs[0].x;

    /**
     * The hidden layers occupy the SAME vertical band as the two real columns.
     *
     * They used to span `h * 0.44` centred on the viewport — 384px on a 872px
     * screen, against roughly 200px for the docks they connect. So the middle
     * of the network bulged well above and below the icons at either end, and
     * the band moved whenever the window height changed while the docks, being
     * sized by their own content, did not. Two of the four layers were read
     * from the interface and two were invented from the viewport.
     *
     * Reading the band off the real controls makes all four columns share the
     * same rows, and makes the whole drawing a function of the interface: the
     * only thing that can move a hidden node now is a dock moving.
     */
    const ys = [...inputs, ...outputs].map((p) => p.y);
    const bandMid = (Math.min(...ys) + Math.max(...ys)) / 2;
    // The controls' own band, then scaled by HIDDEN_SPREAD and re-centred on
    // its midpoint. Still a function of the interface — only a dock moving can
    // move a hidden node — but no longer confined to a 10:1 strip. See
    // netShape.js for why the flat version read as scan lines.
    const span = (Math.max(...ys) - Math.min(...ys)) * HIDDEN_SPREAD;
    const bandTop = bandMid - span / 2;

    const hidden = HIDDEN.map((count, li) => {
      const x = x0 + ((x1 - x0) * (li + 1)) / (HIDDEN.length + 1);
      return Array.from({ length: count }, (_, ni) =>
        toWorld(
          // Spread inclusively, first node on the top edge and last on the
          // bottom, so a layer fills its span rather than floating inside it.
          // `count - 1` guards a one-unit layer against /0.
          { x, y: count === 1 ? bandMid : bandTop + (span * ni) / (count - 1) },
          // A little per-node jitter in z, or each hidden layer reads as a flat
          // card standing in space and the volume collapses back to 2D.
          HIDDEN_DEPTH[li] + Math.sin(ni * 2.3 + li) * 34
        )
      );
    });

    layers = [inputs.map((p) => toWorld(p)), ...hidden, outputs.map((p) => toWorld(p))];

    disposeGraph();

    /**
     * Only the HIDDEN layers get a drawn node. The first and last layers are
     * the contact dock and the section rail — the reader is already looking at
     * those nodes, and they are rendered by the interface, in the interface's
     * own colours, at `z-40` where nothing can paint over them.
     *
     * Drawing a point there too meant nine of the scene's 23 nodes sat under
     * an opaque tile every frame. Worse, it made the diagram's one real claim
     * unreadable: if the node is a dot behind the icon, the icon is not the
     * node, and the whole thing is a lattice that happens to end near a dock.
     * Leaving them out is what makes the edge arrive AT the control.
     */
    const nodeGeo = new BufferGeometry().setFromPoints(layers.slice(1, -1).flat());
    nodes = new Points(nodeGeo, nodeMat);
    scene.add(nodes);

    /**
     * Fully connected, which is what a dense layer is: every unit reads every
     * unit of the layer before it. See `edgesFor` in netShape.js for why the
     * sparse version that used to live here was the drawing contradicting its
     * own captions, and for what pays the visual cost (alpha, not edge count).
     */
    // Grouped BY HOP as well as flattened. The flat list is what the geometry
    // wants; `hops[k]` is what a wave needs — every edge crossing the gap from
    // layer k to layer k+1, so the whole gap can carry at once.
    hops = [];
    hopVerts = [];
    const pairs = [];
    for (let i = 0; i < layers.length - 1; i++) {
      const startVertex = pairs.length;
      hops[i] = edgesFor(layers[i], layers[i + 1]);
      hops[i].forEach(([a, b]) => pairs.push(a, b));
      hopVerts[i] = { start: startVertex, count: pairs.length - startVertex };
    }
    const edgeGeo = new BufferGeometry().setFromPoints(pairs);
    // One colour per vertex, filled by paintEdges(). Allocated here because it
    // has to match the position count exactly.
    edgeGeo.setAttribute("color", new BufferAttribute(new Float32Array(pairs.length * 3), 3));
    edges = new LineSegments(edgeGeo, edgeMat);
    scene.add(edges);
    paintEdges();

    /* A pass in flight is holding Vector3s from the graph that was just
       replaced, so it would interpolate between nodes no longer on screen —
       and `build()` runs on every resize tick and twice a second on the poll.
       Dropping it costs at most one pass and cannot leave a front stranded.
       `rest` is left alone: restarting it here would mean a window being
       dragged never gets far enough into the quiet to start one. */
    wave = null;

    labelLayers();
  };

  /**
   * The layer names, as DOM text rather than anything in the scene. Text in
   * WebGL means either a canvas texture per string or a font atlas, and both
   * are more machinery than four words justify — and DOM text stays selectable,
   * scales with the reader's own text-size control, and costs no GL state.
   *
   * They are placed from the layer x positions, so a dock that moves takes its
   * label with it. The camera parallax is deliberately NOT applied here: a
   * label that slides under the pointer reads as a loose caption, and 46px of
   * camera travel is under a character's width at this size anyway.
   */
  const labelLayers = () => {
    if (!layers.length) { labelBox.replaceChildren(); return; }
    const spans = layers.map((layer, i) => {
      const { name, gloss } = LAYERS[i] ?? { name: "", gloss: "" };
      const el = document.createElement("span");
      el.className =
        "absolute -translate-x-1/2 flex flex-col items-center gap-0.5 text-center whitespace-nowrap";

      /**
       * The label goes under the column's PROJECTED x, not its world x.
       *
       * `layer[0].x + w / 2` was right only while `toWorld` was the identity.
       * Now that a hidden node is pre-divided by its own perspective factor,
       * reading its world x back gives the pre-compensation number and the
       * label lands where the nodes used to be wrong. Re-applying the same
       * projection recovers the pixel the column actually draws on, which is
       * the column the label is naming.
       */
      const d = camDist();
      const screenX = (layer[0].x * d) / (d - layer[0].z) + w / 2;
      // Still clamped inside the viewport, for the same reason as before: a
      // centred label under the input column would otherwise hang off the left.
      el.style.left = `${Math.min(w - 64, Math.max(64, screenX))}px`;
      el.style.bottom = "22px";

      const title = document.createElement("span");
      title.className = "font-mono text-label text-faint";
      title.textContent = name;
      el.append(title);

      // Only the two layers a reader can point at carry a gloss. See netShape.js.
      if (gloss) {
        const sub = document.createElement("span");
        // `-ink` is the accent variant measured safe as text; the `/80` that used
        // to be here pulled it back under AA (4.27:1 light, 4.24:1 dark at 10px).
        sub.className = "font-sans text-[10px] leading-none tracking-[0.04em] text-accent-ink";
        sub.textContent = gloss;
        el.append(sub);
      }

      const count = document.createElement("span");
      // `--c-faint` is documented per palette as the 10-13px label colour and is
    // measured to pass at this size. The `/60` undid that: 2.36:1 on white,
    // 2.86:1 on the dark ground, for a numeral that states a real layer size.
    count.className = "font-mono text-[10px] leading-none text-faint tabular-nums";
      count.textContent = String(layer.length);
      el.append(count);

      return el;
    });
    labelBox.replaceChildren(...spans);
  };

  // --- activations ----------------------------------------------------------
  const signalGeo = new BufferGeometry();
  const signalPos = new Float32Array(MAX_SIGNALS * 3);
  const signalCol = new Float32Array(MAX_SIGNALS * 3);
  signalGeo.setAttribute("position", new BufferAttribute(signalPos, 3));
  signalGeo.setAttribute("color", new BufferAttribute(signalCol, 3));
  const signals = new Points(signalGeo, signalMat);
  signals.frustumCulled = false;
  scene.add(signals);


  /**
   * Light the REAL control an activation just left or just reached.
   *
   * This is the part that explains the diagram without a word of copy. A
   * reader watching their own GitHub icon pulse, and then a section dot pulse
   * when the dot crossing the screen arrives, learns what the field is for in
   * one pass — the icons are the input vector, the sections are the output.
   * Told in a caption, that sentence is a claim; shown this way it is a
   * demonstration, and the reader did the inferring.
   *
   * A Map rather than a bare timeout so a control fired twice in quick
   * succession restarts its pulse instead of having the first timer cut the
   * second one short.
   */
  const lit = new Map();
  const fire = (el) => {
    if (!el) return;
    // Removing and re-adding in the same frame does not restart a CSS
    // animation; forcing a reflow between the two does.
    el.classList.remove("net-fire");
    void el.offsetWidth;
    el.classList.add("net-fire");
    clearTimeout(lit.get(el));
    lit.set(el, window.setTimeout(() => {
      el.classList.remove("net-fire");
      lit.delete(el);
    }, FIRE_MS));
  };

  /** Every control back to rest, whatever it was mid-pulse. Teardown only. */
  const unfireAll = () => {
    lit.forEach((id, el) => { clearTimeout(id); el.classList.remove("net-fire"); });
    lit.clear();
  };

  /**
   * A FORWARD PASS, NOT A PATH THROUGH IT.
   *
   * What this used to do: pick one unit per layer and send a single dot down
   * that chain, input -> hidden -> hidden -> output. It looked like a network
   * and it described something a network does not do. A layer in an MLP is one
   * matrix multiply: every unit of layer k+1 reads every unit of layer k, all
   * at once. There is no path, and nothing waits its turn — which is exactly
   * how the old animation read, as layer 1 finishing before layer 2 starts.
   *
   * A wave instead. One gap at a time carries EVERY edge crossing it
   * simultaneously, then the next gap, then the next. That is forward
   * propagation, and it is also the quieter option: one coherent front the eye
   * can follow, rather than eight independent dots on unrelated routes.
   *
   * It also fixes the firing. The whole input layer is the input VECTOR, so
   * every contact icon lights when a pass begins and every section dot lights
   * when it lands — not one of each, which quietly said the pass involved a
   * single icon.
   */
  let wave = null;      // { hop, t } or null between passes
  let rest = 1.2;       // seconds of quiet left before the next pass
  let passesLeft = PASS_BUDGET; // then the field settles and holds still

  const beginPass = () => {
    if (!hops.length || passesLeft <= 0) return;
    passesLeft -= 1;
    wave = { hop: 0, t: 0 };
    ends.in.forEach(fire);
  };

  const stepSignals = (dt) => {
    if (!wave) {
      // Spent its budget: the wires hold at EDGE_REST and nothing moves until
      // the reader leaves the hero and comes back. See onScroll.
      if (passesLeft <= 0) { signalGeo.setDrawRange(0, 0); return; }
      rest -= dt;
      if (rest <= 0) beginPass();
      signalGeo.setDrawRange(0, 0);
      return;
    }

    wave.t += dt / HOP_SECONDS;
    if (wave.t >= 1) {
      wave.hop += 1;
      wave.t = 0;
      if (wave.hop >= hops.length) {
        // Landed. The output layer IS the five sections, so all five light.
        ends.out.forEach(fire);
        wave = null;
        rest = REST_SECONDS;
        signalGeo.setDrawRange(0, 0);
        paintEdges(); // back to rest, or the last gap stays lit
        return;
      }
    }

    paintEdges();

    const gap = hops[wave.hop];
    const n = Math.min(gap.length, MAX_SIGNALS);
    const [ar, ag, ab] = rgb(root, "--c-accent");

    for (let i = 0; i < n; i++) {
      const [a, b] = gap[i];

      /**
       * A small per-edge phase offset, so the front is a WAVE rather than a
       * ruler. Every dot leaving on the same frame and arriving on the same
       * frame drew a rigid vertical line sweeping the page, which is what read
       * as mechanical -- a scanline, not a network firing.
       *
       * Derived from the edge index rather than random, so it is identical on
       * every frame and every pass; a jitter that resampled would shimmer.
       * The spread is a tenth of the hop, far too small to suggest the layers
       * take turns, which they do not.
       */
      const phase = ((i % 5) / 5) * 0.1;
      const tt = Math.max(0, Math.min(1, (wave.t - phase) / (1 - 0.1)));

      // Ease, so a front leaves its layer and settles into the next rather
      // than crossing at a constant crawl.
      const f = tt < 0.5 ? 2 * tt * tt : 1 - ((-2 * tt + 2) ** 2) / 2;

      signalPos[i * 3] = a.x + (b.x - a.x) * f;
      signalPos[i * 3 + 1] = a.y + (b.y - a.y) * f;
      signalPos[i * 3 + 2] = a.z + (b.z - a.z) * f;

      // Bright through the middle of the crossing, nothing at either end, so
      // an activation grows out of the layer it left and dissolves into the
      // one it reaches.
      const glow = Math.sin(Math.PI * tt) ** 0.6;
      signalCol[i * 3] = (ar / 255) * glow;
      signalCol[i * 3 + 1] = (ag / 255) * glow;
      signalCol[i * 3 + 2] = (ab / 255) * glow;
    }
    signalGeo.setDrawRange(0, n);
    signalGeo.attributes.position.needsUpdate = true;
    signalGeo.attributes.color.needsUpdate = true;
  };

  /* --- camera parallax ------------------------------------------------------
     This comment used to read: "The pointer moves the camera, not the scene:
     moving the scene would slide the input layer off the dock it is anchored
     to, which is the one thing this drawing promises."

     That is not what the code does. `camera.lookAt(0, 0, 0)` ROTATES the
     camera as well as translating it, and a rotation leaves only the world
     origin fixed — so everything off-centre skews, and the two anchored layers
     are the furthest off-centre things in the scene. Measured at 1513x883 by
     projecting the real nodes through the real camera at both extremes of the
     pointer travel:

       INPUT     57.5 -> 74.7   swing 17.1px   (the dock tile is 44px wide)
       HIDDEN 1  523.3 -> 519.5 swing -3.8px
       HIDDEN 2  974.0 -> 979.2 swing  5.2px
       OUTPUT    1424.8 -> 1439 swing 14.2px

     The two layers that are supposed to be nailed to the interface move four
     times as much as the two that are free, which is exactly backwards.

     KEPT ANYWAY, on the owner's call, after being shown those numbers: the
     drift is small, it only happens while the pointer is moving, and the depth
     it sells is the reason the scene is 3D at all. `PARALLAX` is the knob --
     set both to 0 and the anchored layers are pixel-exact at every pointer
     position, with the rest of the diagram unchanged. */
  const PARALLAX = { x: 30, y: 20 };

  let px = 0, py = 0, cx = 0, cy = 0;
  const onPointer = (e) => {
    // 30/20, down from 46/30. A reader moving the pointer toward a link should
    // not shift the whole backdrop behind the text they are reading.
    px = (e.clientX / w - 0.5) * PARALLAX.x;
    py = (e.clientY / h - 0.5) * PARALLAX.y;
  };

  // --- loop -----------------------------------------------------------------
  /**
   * The breakpoint is checked HERE, not upstream.
   *
   * The two docks this module is wired to are `hidden rail:flex` — they do not
   * exist below 1024px, so there is nothing to anchor to and nothing worth
   * drawing. `NeuralField` looks like it already handles that, and does not:
   * its `start()` opens with `if (handed) return`, which fires before its own
   * `if (!wide.matches) return stop()`. Once this module has taken the canvas,
   * nothing upstream can ever tell it to stand down, so a window dragged narrow
   * kept a WebGL render loop alive at phone widths for a scene with no nodes in
   * it. Owning the test here needs no protocol between the two files.
   */
  const wide = window.matchMedia("(min-width: 1024px)");

  let raf = 0, last = 0, poll = 0, onScreen = true, hidden = false, fade = 1;

  const frame = (ts) => {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0;
    last = ts;
    if (!onScreen || hidden || !wide.matches) return;

    // A longer tail on the easing, so the camera drifts to the pointer rather
    // than tracking it.
    cx += (px - cx) * 0.028;
    cy += (py - cy) * 0.028;
    camera.position.x = cx;
    camera.position.y = -cy;
    camera.lookAt(0, 0, 0);

    /**
     * No spawn-rate roll any more: passes are paced by `stepSignals` itself,
     * one at a time with `REST_SECONDS` of quiet between them. The randomness
     * that used to live here was what made the old field read as weather
     * rather than as a computation — a network does not fire a unit when a
     * die comes up.
     *
     * The attention budget PR #43 set still holds. It measured
     * `concurrent ≈ spawn rate × lifetime` and landed on ~4.9 lit dots; a pass
     * here shows 8, 16 and 12 across its three gaps and then nothing at all
     * for 2.8s, which averages to about 6 over the cycle but spends a third of
     * every cycle completely still. Motion that stops is far easier to read
     * over than motion that never does.
     */
    stepSignals(dt);
    renderer.render(scene, camera);
  };

  // Scoped to the landing view, like the 2D field: a backdrop that follows the
  // reader through Experience and Contact is wallpaper competing with text.
  /**
   * Scoped to the landing view, and the place the pass budget refills.
   *
   * `left` latches once the hero is properly off screen, so coming back to the
   * top is what grants another two passes. Without the latch, the tiny scroll
   * jitter around the top of the page would re-arm the field continuously and
   * the budget would mean nothing.
   */
  let left = false;
  const onScroll = () => {
    const next = Math.max(0, 1 - window.scrollY / (h * 0.75));
    if (Math.abs(next - fade) > 0.01) {
      fade = next;
      canvas.style.opacity = String(fade);
      labelBox.style.opacity = String(fade * 0.7);
    }
    onScreen = fade > 0.02;

    if (fade < 0.15) left = true;
    else if (left && fade > 0.9) {
      left = false;
      passesLeft = PASS_BUDGET;
      rest = 0.6; // a beat after arriving, not the instant the scroll lands
    }
  };

  /**
   * devicePixelRatio is NOT constant for the life of a page.
   *
   * It changes on browser zoom, and on dragging the window between a retina
   * laptop panel and an external monitor. It was read once at start() and
   * never again, so either of those left the drawing buffer sized for the old
   * ratio: the field came back soft on one screen and over-sampled on the
   * other. Cheap enough to check on every resize and on the poll, and a no-op
   * unless the number actually moved.
   */
  let lastDpr = 0;
  const syncPixelRatio = () => {
    const next = Math.min(window.devicePixelRatio || 1, 1.5);
    if (next === lastDpr) return false;
    lastDpr = next;
    renderer.setPixelRatio(next);
    return true;
  };

  const onResize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    // Hidden rather than left holding its last frame. `frame()` stops rendering
    // below the breakpoint, and a stopped renderer does not clear what it
    // already drew — so without this the narrow window kept a frozen lattice
    // painted over the mobile hero.
    canvas.style.display = wide.matches ? "" : "none";
    syncPixelRatio();
    fit();
    build();
  };

  const onVisibility = () => { hidden = document.hidden; };

  const themeWatch = new MutationObserver(paintTheme);
  themeWatch.observe(root, { attributes: true, attributeFilter: ["data-theme", "data-scheme"] });

  // `onResize()` rather than `fit(); build();` — it is the same two calls plus
  // the breakpoint's canvas visibility, and starting through it means a tab
  // opened already narrow takes the same path as one dragged narrow later.
  onResize();
  onScroll();

  /**
   * STAYING WIRED, IN REAL TIME.
   *
   * The 500ms poll stays: it is the catch-all for the things no event reports
   * — the dock hiding itself as Contact scrolls in, a font swapping, the
   * reader's own text-size control changing a cell's height. What it is bad at
   * is the thing a person actually does, which is drag a window edge: half a
   * second of the network lagging behind its own dock, every frame of the drag.
   *
   * So the observers below handle the fast path and the poll handles the rest.
   *
   *  - ResizeObserver on each dock: fires the moment a cell changes size or
   *    the dock reflows, which a window resize does before `resize` settles.
   *  - visualViewport: pinch-zoom and the on-screen keyboard change the
   *    viewport WITHOUT firing window.resize. Guarded because Safari shipped
   *    it late enough to matter.
   */
  const anchorWatch = new ResizeObserver(build);
  for (const sel of ['nav[aria-label="Contact shortcuts"]', 'nav[aria-label="Sections"]']) {
    const nav = document.querySelector(sel);
    if (nav) anchorWatch.observe(nav);
  }
  window.visualViewport?.addEventListener("resize", onResize);

  poll = window.setInterval(() => {
    // A DPR change with no resize event — an external monitor at a different
    // scale factor — needs the buffer resized, not just the graph rebuilt.
    if (syncPixelRatio()) fit();
    build();
  }, 500);
  window.addEventListener("resize", onResize);
  wide.addEventListener("change", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    clearInterval(poll);
    themeWatch.disconnect();
    anchorWatch.disconnect();
    window.visualViewport?.removeEventListener("resize", onResize);
    window.removeEventListener("resize", onResize);
    wide.removeEventListener("change", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    // The pulse classes live on the rails, which this module does not own and
    // React keeps mounted. Leaving one behind outlives the field itself.
    unfireAll();
    disposeGraph();
    labelBox.remove();
    canvas.remove();
    signalGeo.dispose();
    nodeMat.dispose();
    edgeMat.dispose();
    signalMat.dispose();
    dot.dispose(); // the sprite is a GPU texture, not just a canvas
    // Frees the GL context. Without it a resize that remounts this leaks one
    // context per mount, and browsers hard-cap the number a page may hold.
    renderer.dispose();
    renderer.forceContextLoss();
  };
};
