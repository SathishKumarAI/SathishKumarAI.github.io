# src/utils

Eleven files: five that the app imports at runtime, six that only ever run in
a terminal. Read the table, not the directory.

## Change to file

| You want to change | Open |
| --- | --- |
| What the ⌘K ask box retrieves, and how it ranks | `answer.js` |
| The reader's own time zone, and the hour difference | `localzone.js` |
| Shared canvas geometry and the seeded RNG the covers use | `draw.js` |
| The entrance animations every section shares | `motion.js` |
| How the ask-palette shortcut is spelled on this reader's platform | `shortcut.js` |

## The tests, and the failure each one is named for

They are plain Node files with `node:assert`. No framework, no config, no
runner — `npm test` is six `node` invocations chained with `&&`. Each is named
for the bug that shipped before it existed.

| File | Catches |
| --- | --- |
| `answer.test.mjs` | the ask box citing a section that does not exist, or retrieving nothing for a question the page can answer |
| `localzone.test.mjs` | daylight saving arithmetic, and a zone treated as an address |
| `llms-mirror.test.mjs` | `public/llms.txt` drifting from the real content |
| `html-mirror.test.mjs` | the `<noscript>` and JSON-LD copies drifting from the page |
| `netshape.test.mjs` | the hero field drawing a unit with no incoming edge |
| `stages.test.mjs` | the Stack's two filings covering different sets of tools |

**Run one directly while working on it:** `node src/utils/stages.test.mjs`.
They print `ok` per assertion and exit non-zero on the first failure.

## Rules this directory follows

- **A test is named for the failure it catches**, not for the function it
  calls. `test_every_unit_has_an_incoming_edge` tells you what broke; `test_edges_2`
  does not.
- **Arm a test before trusting it.** Break the thing it is meant to catch,
  watch it go red, put it back. A test that has only ever been green has not
  been run — it has been *observed*.
- **These catch drift, not judgement.** `stages.test.mjs` proves the two
  filings of the stack cover the same 56 tools. It cannot prove a tool is in
  the *right* box; that is what `docs/STACK-TAXONOMY.md` is for.
- **Runtime helpers stay pure.** Nothing here reaches into the DOM or imports a
  component. `answer.js` takes a string and returns ranked passages; that is
  why the same index can serve the ⌘K palette and the retrieval panel in the
  footer band without either knowing about the other.
