/**
 * The tools, filed by skill area. This is the TOOL LIST's filing; the
 * diagram's filing is `system.js`, and `utils/stages.test.mjs` fails if the
 * two stop covering the same set.
 *
 * Split out of a single 885-line `index.js` on 2026-10-16. `index.js` is now a
 * barrel re-exporting every one of these, so every existing
 * `from "../constants"` import is unchanged.
 */

// `services` lived here: six "focus areas" rendered as cards in About. Deleted
// with the cards, not orphaned, because the six `stackGroups` below already
// partition the same skills and do it with named tools instead of adjectives.
// Two taxonomies of one person is one too many; the specific one won.

// Grouped stack, six areas across the data-to-AI path.
/**
 * Each group carries its own scan-aid dot class and its own primary tools.
 * `dot` is a full Tailwind class, not a token fragment, because Tailwind scans
 * for literal class strings: `bg-${g.dot}` built from "cat-data" would be
 * purged, while the literal "bg-cat-data" sitting here is found.
 * `tint` is the SAME colour as a raw variable name, because the card's glow
 * and the pipeline rail need `rgb(var(--c-cat-data) / 0.2)` and a Tailwind
 * class cannot be taken apart back into its token. Two fields for one colour
 * is the price of Tailwind's literal-string scan; they are declared adjacent
 * so they cannot drift apart unnoticed.
 * `primary` marks the tools that get the filled chip. Everything else stays
 * outline. Two per group is the ceiling on purpose: mark four and nothing is
 * marked.
 */
export const stackGroups = [
  {
    title: "Data engineering",
    note: "Moving and shaping data so the rest can trust it.",
    dot: "bg-cat-data",
    tint: "--c-cat-data",
    primary: ["PySpark", "SQL"],
    items: ["PySpark", "Airflow", "ETL pipelines", "PostgreSQL", "DynamoDB", "DuckDB", "S3", "SQL", "Snowflake", "Databricks", "Unity Catalog"],
  },
  {
    title: "Data science",
    note: "Finding what the data actually supports.",
    dot: "bg-cat-science",
    tint: "--c-cat-science",
    primary: ["pandas", "scikit-learn"],
    items: ["pandas", "Polars", "NumPy", "scikit-learn", "Jupyter", "Plotly", "Evaluation", "Exploratory analysis"],
  },
  {
    title: "LLM / RAG",
    note: "Grounded answers with citations, offline-first.",
    dot: "bg-cat-llm",
    tint: "--c-cat-llm",
    primary: ["Hugging Face", "LangChain"],
    items: ["Hugging Face", "Transformers", "LangChain", "LangGraph", "Fine-tuning", "vLLM", "Ollama", "Claude", "Pinecone", "Embeddings", "Guardrails", "LangSmith", "Ragas"],
  },
  {
    title: "Computer vision",
    note: "Detection and tracking on real footage.",
    dot: "bg-cat-vision",
    tint: "--c-cat-vision",
    primary: ["YOLOv8", "PyTorch"],
    items: ["YOLOv8", "OpenCV", "Detection & tracking", "Federated learning", "PyTorch"],
  },
  {
    title: "MLOps & infra",
    note: "Shipping models like software: reproducible, deployable.",
    dot: "bg-cat-mlops",
    tint: "--c-cat-mlops",
    primary: ["MLflow", "Docker"],
    items: ["MLflow", "Weights & Biases", "DVC", "Docker", "GitHub Actions", "Kubernetes", "Helm", "IAM & RBAC", "Secrets management", "PII & anonymisation"],
  },
  {
    title: "Backend & apps",
    note: "The interface a person actually uses.",
    dot: "bg-cat-backend",
    tint: "--c-cat-backend",
    primary: ["Python", "FastAPI"],
    items: ["Python", "FastAPI", "Pydantic", "pytest", "Streamlit", "Next.js", "React", "TypeScript", "Tauri"],
  },
];

/**
 * How many tools the stack actually holds.
 *
 * A SET, NOT A SUM: a tool may sit in more than one group, and adding the array
 * lengths would claim more than he lists.
 *
 * Exported because three places had started to answer this question
 * independently and two of them had drifted to a number that was never
 * recounted: the Stack eyebrow derived it correctly while `DIAGRAM_WHY` said
 * "47 tools" in copy a reader can open. A fact hard-coded in a component is a
 * bug, per docs/site/DECISIONS.md -- so it is computed once, here, next to the
 * data it counts.
 */
export const TOOL_COUNT = new Set(stackGroups.flatMap((g) => g.items)).size;
