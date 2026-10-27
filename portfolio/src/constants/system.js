/**
 * The same tools, filed by the job they do in a system: three planes that
 * pass work downward, and a substrate everything stands on.
 *
 * Split out of a single 885-line `index.js` on 2026-10-16. `index.js` is now a
 * barrel re-exporting every one of these, so every existing
 * `from "../constants"` import is unchanged.
 */
import { TOOL_COUNT } from "./stack.js";

export const systemPlanes = [
  {
    id: "data",
    title: "Data plane",
    role: "Get it, keep it, understand it",
    flow: "--c-flow-1",
    out: "features & findings",
    nodes: [
      {
        id: "ingest",
        title: "Ingest & orchestrate",
        role: "Move it, on a schedule",
        items: ["Airflow", "ETL pipelines", "PySpark"],
      },
      {
        id: "store",
        title: "Store",
        role: "Keep it addressable",
        items: ["S3", "PostgreSQL", "DynamoDB", "DuckDB", "SQL", "Snowflake", "Databricks", "Unity Catalog", "PII & anonymisation"],
      },
      {
        id: "shape",
        title: "Shape & analyse",
        role: "Make it a table you can trust",
        items: ["pandas", "Polars", "NumPy", "Exploratory analysis"],
      },
      {
        id: "express",
        title: "Visualise",
        role: "Show what it supports",
        items: ["Jupyter", "Plotly", "Streamlit"],
      },
    ],
  },
  {
    id: "model",
    title: "Model plane",
    role: "Learn something from it",
    flow: "--c-flow-2",
    out: "weights & an index",
    // ALTERNATIVES, not steps. These five do not run in order and most
    // projects use one or two of them; drawing them as a chain would claim a
    // dependency between object detection and retrieval that does not exist.
    parallel: true,
    nodes: [
      {
        id: "detect",
        title: "Vision — detect & track",
        role: "Find it in a frame, follow it",
        items: ["PyTorch", "YOLOv8", "OpenCV", "Detection & tracking"],
      },
      {
        id: "federated",
        title: "Vision — federated",
        role: "Train where the data already is",
        items: ["Federated learning"],
      },
      {
        id: "classical",
        title: "Classical ML",
        role: "When a smaller model is the honest answer",
        items: ["scikit-learn"],
      },
      {
        id: "adapt",
        title: "Language — adapt",
        role: "Take a general model, fit it to the task",
        items: ["Hugging Face", "Transformers", "Fine-tuning"],
      },
      {
        id: "providers",
        title: "Hosted models",
        role: "Frontier models called, not run",
        items: ["Claude"],
      },
      {
        id: "retrieve",
        title: "Language — retrieve",
        role: "Ground the answer in real sources",
        items: ["Embeddings", "Pinecone", "LangChain", "LangGraph"],
      },
    ],
  },
  {
    id: "serve",
    title: "Serving plane",
    role: "Put it in front of someone",
    flow: "--c-flow-3",
    nodes: [
      {
        id: "inference",
        title: "Inference",
        role: "Run a model on your own hardware",
        items: ["vLLM", "Ollama"],
      },
      {
        id: "api",
        title: "API",
        role: "A contract, and bad input stopped at the edge",
        items: ["FastAPI", "Pydantic", "Guardrails"],
      },
      {
        id: "interface",
        title: "Interface",
        role: "The screen a person actually uses",
        items: ["Next.js", "React", "TypeScript", "Tauri"],
      },
    ],
  },
];

/**
 * NOT A PLANE. Nothing flows into it and nothing flows out of it: it is what
 * the three planes above are standing on, which is why it is drawn underneath
 * them, in neutral, with no arrow into it.
 *
 * The owner's own framing: "Python is a language where I can use for the
 * coding, Docker, Kubernetes for the MLOps" — those are not steps, they are
 * the ground.
 */

/**
 * NOT A PLANE. Nothing flows into it and nothing flows out of it: it is what
 * the three planes above are standing on, which is why it is drawn underneath
 * them, in neutral, with no arrow into it.
 *
 * The owner's own framing: "Python is a language where I can use for the
 * coding, Docker, Kubernetes for the MLOps" — those are not steps, they are
 * the ground.
 */
export const systemSubstrate = {
  title: "Substrate",
  role: "Everything above runs on this",
  nodes: [
    {
      id: "language",
      title: "Language & tests",
      role: "What all of it is written and checked in",
      items: ["Python", "pytest"],
    },
    {
      id: "package",
      title: "Package & run",
      role: "Same behaviour on a laptop and a cluster",
      items: ["Docker", "Kubernetes", "Helm", "IAM & RBAC", "Secrets management"],
    },
    {
      id: "deliver",
      title: "Deliver",
      role: "Every change built and shipped the same way",
      items: ["GitHub Actions"],
    },
    {
      id: "track",
      title: "Track & evaluate",
      role: "Know which run produced which number",
      items: ["MLflow", "Weights & Biases", "DVC", "Evaluation", "LangSmith", "Ragas"],
    },
  ],
};

/**
 * WHY THE STACK IS ALSO DRAWN AS A SYSTEM, in the reader's words rather than
 * the code's. Opened from a `?` beside the diagram, the same affordance the
 * hero field uses -- a visualisation that needs explaining should carry its
 * own explanation rather than assuming the reader shares the author's mental
 * model.
 */
export const DIAGRAM_WHY = [
  "A tool list answers what I know. It cannot answer whether the pieces fit together, which is the question an interview actually asks.",
  `So the boxes here are not my skill areas — they are the jobs a system has to do. Three planes pass work downward; inside a plane, nodes are either a sequence or alternatives. Same ${TOOL_COUNT} tools; only the filing changes.`,
  "The arrows carry what moves between stages, two stages run in parallel rather than in sequence, and the band underneath is what everything else stands on.",
  "Colour is depth, not category: one hue getting warmer as the work moves from raw data to a shipped product. The substrate sits off that scale, in neutral, because it is not a position on the path.",
  "Every managed piece is a role, not a lock-in: pick a platform to see what fills each one on AWS, Google Cloud or Azure.",
];
