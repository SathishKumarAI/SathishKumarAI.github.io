// Run: node src/utils/stages.test.mjs   (also `npm test`)
//
// Named for the failure this repo keeps re-committing: two hand-maintained
// lists of the same strings, drifting apart silently.
//
// Stack renders the same tools twice -- `stackGroups` files them by skill
// area for the tool list, `systemPlanes` files them by responsibility for the
// system diagram. Nothing in React notices when a tool is added to one and not
// the other: the list simply gains a term, the diagram simply does not, and
// both views render perfectly. The only symptom is a tool that exists in one
// reading of the stack and not the other, which is the kind of thing nobody
// finds by looking.
//
// Checked here rather than in the browser because it is set arithmetic over
// two constants, and because one missing term among dozens looks like a deliberate
// omission until someone counts.
import assert from "node:assert/strict";
import {
  stackGroups,
  systemPlanes,
  systemSubstrate,
  platformMatrix,
  PLATFORMS,
  glossary,
} from "../constants/index.js";

const listTools = () => new Set(stackGroups.flatMap((g) => g.items));
const allNodes = () => [
  ...systemPlanes.flatMap((p) => p.nodes),
  ...systemSubstrate.nodes,
];
const stageTools = () => allNodes().flatMap((n) => n.items);

// The one that will regress. Add a tool to `stackGroups` and forget the
// diagram, and it is missing from half the section with nothing to say so.
const test_every_listed_tool_appears_in_a_stage = () => {
  const stages = new Set(stageTools());
  const missing = [...listTools()].filter((t) => !stages.has(t));
  assert.deepEqual(
    missing,
    [],
    `in stackGroups but in no system stage: ${missing.join(", ")}`
  );
};

// And the mirror: a stage naming a tool the list does not carry would put a
// term in the diagram that has no definition and no glyph behind it.
const test_every_staged_tool_is_a_listed_tool = () => {
  const list = listTools();
  const stray = stageTools().filter((t) => !list.has(t));
  assert.deepEqual(
    stray,
    [],
    `in a system stage but not in stackGroups: ${stray.join(", ")}`
  );
};

// A tool in two stages is drawn twice in one diagram, which reads as two
// different things sharing a name rather than as one thing used twice.
const test_no_tool_is_staged_twice = () => {
  const all = stageTools();
  const dupes = [...new Set(all.filter((t, i) => all.indexOf(t) !== i))];
  assert.deepEqual(dupes, [], `staged more than once: ${dupes.join(", ")}`);
};

// Every term the section renders is hoverable for a definition. A term with no
// glossary entry renders with no dotted underline and does nothing on hover --
// indistinguishable, to a reader, from one that is broken.
const test_every_staged_tool_has_a_definition = () => {
  const undefined_ = stageTools().filter((t) => !glossary[t]);
  assert.deepEqual(
    undefined_,
    [],
    `no glossary entry: ${undefined_.join(", ")}`
  );
};

// A node with no tools is an empty box making a claim about a responsibility
// nothing fills -- which is worse than not drawing it, because the reader
// assumes the gap is deliberate.
const test_no_node_is_empty = () => {
  const empty = allNodes().filter((n) => !n.items.length).map((n) => n.id);
  assert.deepEqual(empty, [], `nodes with no tools: ${empty.join(", ")}`);
};

// Every node needs the two lines the drawing is built on: what it is called
// and what it is RESPONSIBLE for. The second is the whole difference between
// this view and the tool list.
const test_every_node_states_a_responsibility = () => {
  const bare = allNodes()
    .filter((n) => !n.title || !n.role)
    .map((n) => n.id);
  assert.deepEqual(bare, [], `nodes missing a title or role: ${bare.join(", ")}`);
};

// The matrix is the diagram's whole claim about portability. A row missing a
// vendor renders as a gap in one column and not the others, which reads as
// "there is no equivalent" rather than "someone forgot a cell".
const test_every_role_covers_every_cloud = () => {
  for (const r of platformMatrix) {
    for (const k of ["aws", "gcp", "azure"]) {
      assert.ok(
        typeof r[k] === "string" && r[k].length > 0,
        `${r.role}: no ${k} equivalent`
      );
    }
  }
};

// `mine` is the ONLY column that is a claim about the owner, so it may only
// name something he actually lists. The cloud columns are claims about the
// platforms and are deliberately not held to that.
const test_the_mine_column_only_names_real_tools = () => {
  const list = listTools();
  const invented = platformMatrix
    .filter((r) => r.mine && !list.has(r.mine))
    .map((r) => `${r.role}: ${r.mine}`);
  assert.deepEqual(
    invented,
    [],
    `"what I use" names something absent from the stack: ${invented.join(", ")}`
  );
};

// A role listed twice is two rows a reader has to reconcile.
const test_no_role_is_listed_twice = () => {
  const roles = platformMatrix.map((r) => r.role);
  const dupes = [...new Set(roles.filter((x, i) => roles.indexOf(x) !== i))];
  assert.deepEqual(dupes, [], `role listed more than once: ${dupes.join(", ")}`);
};

// Every row belongs to one of the diagram's planes, so the table can be
// grouped the same way the drawing is.
const test_every_role_sits_in_a_known_plane = () => {
  const known = new Set([...systemPlanes.map((p) => p.title.split(" ")[0]), "Substrate"]);
  const stray = [...new Set(platformMatrix.map((r) => r.plane))].filter(
    (p) => !known.has(p)
  );
  assert.deepEqual(stray, [], `unknown plane in the matrix: ${stray.join(", ")}`);
};

const tests = [
  test_no_node_is_empty,
  test_every_node_states_a_responsibility,
  test_every_listed_tool_appears_in_a_stage,
  test_every_staged_tool_is_a_listed_tool,
  test_no_tool_is_staged_twice,
  test_every_staged_tool_has_a_definition,
  test_every_role_covers_every_cloud,
  test_the_mine_column_only_names_real_tools,
  test_no_role_is_listed_twice,
  test_every_role_sits_in_a_known_plane,
];

let failed = 0;
for (const t of tests) {
  try {
    t();
    console.log(`ok   ${t.name}`);
  } catch (e) {
    failed++;
    console.error(`FAIL ${t.name}\n     ${e.message}`);
  }
}
console.log(`${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
