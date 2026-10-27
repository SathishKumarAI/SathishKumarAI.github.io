/**
 * The work, with the outcome each one is cited for.
 *
 * Split out of a single 885-line `index.js` on 2026-10-16. `index.js` is now a
 * barrel re-exporting every one of these, so every existing
 * `from "../constants"` import is unchanged.
 */
import { GH } from "./links.js";


export const projects = [
  {
    name: "rag-pipeline-langchain",
    cover: "retrieval",
    outcome: "Production RAG on AWS with a measured retrieval loop and GitOps deploys.",
    stages: ["ingest", "embed", "retrieve", "generate"],
    description:
      "LangChain and LangGraph drive retrieval over a Pinecone store, MLflow tracks every evaluation run, and releases ship through a GitOps path on Kubernetes and Helm.",
    tags: ["RAG", "MLOps", "Kubernetes"],
    source_code_link: `${GH}/rag-pipeline-langchain`,
    live_link: null,
  },
  {
    name: "ai-due-diligence-copilot",
    cover: "citation",
    outcome: "Document Q&A that cites the exact source passage behind every answer.",
    stages: ["docs", "index", "ask", "cite"],
    description:
      "Due-diligence reading over pitch decks, 10-Ks and term sheets. Defaults to a local Ollama model with no account or key; one environment variable switches it to Claude. FastAPI behind a Next.js front end.",
    tags: ["LLM", "RAG", "FastAPI"],
    source_code_link: `${GH}/ai-due-diligence-copilot`,
    live_link: null,
  },
  {
    name: "federated-yolov8-object-detection",
    cover: "federated",
    outcome: "YOLOv8 detection trained federated: raw data never leaves the client.",
    stages: ["clients", "local train", "aggregate", "detect"],
    description:
      "Training is distributed across clients with Flower, only model updates cross the network, never the images. The privacy constraint shapes the architecture rather than sitting on top of it.",
    tags: ["Vision", "Federated", "PyTorch"],
    source_code_link: `${GH}/federated-yolov8-object-detection`,
    live_link: null,
  },
  {
    name: "instagram-reels-extractor",
    cover: "frames",
    outcome: "Turns video into structured, searchable text via transcript, OCR, and vision.",
    stages: ["video", "transcribe", "index", "search"],
    description:
      "Caption, transcript, OCR and structured vision are merged into one document, rendered as a PDF and a linked docs site, with semantic search that runs entirely on your own machine.",
    tags: ["Applied ML", "Multimodal", "Python"],
    source_code_link: `${GH}/instagram-reels-extractor`,
    live_link: null,
  },
  {
    name: "pickleball-vision-llm",
    cover: "tracking",
    outcome: "Detection + tracking over match footage, split into modular layers.",
    stages: ["video", "vision", "api", "ui"],
    description:
      "Four layers that move independently: vision, ML, API, front end, so the detection model can be replaced without touching the interface that shows its output.",
    tags: ["Vision", "OpenCV", "Docker"],
    source_code_link: `${GH}/pickleball-vision-llm`,
    live_link: null,
  },
  {
    name: "pb-card-deck",
    cover: "scorecard",
    outcome: "Live mobile-first scorekeeper: no login, works offline after first load.",
    stages: ["load", "cache", "play", "score"],
    description:
      "A deck of 1,729 twist cards drawn mid-match, alongside side-out scoring. Local-first PWA: no account, no backend, nothing to install.",
    tags: ["Product", "Live", "React"],
    source_code_link: `${GH}/pb-card-deck`,
    live_link: "https://pb-card-deck.vercel.app/",
  },
];

/* ---------------------------------------------------------------------------
   THE SAME TOOLS, AS A LAYERED ARCHITECTURE.

   `stackGroups` above answers "what does he know" and its boxes are areas of
   HIS experience. This answers "how does it fit together", and its boxes are
   the jobs a system has to do.

   WHY PLANES AND NOT ONE CHAIN. The first version of this was five stages in a
   row, and a single chain cannot say the thing that actually matters about an
   ML system: some of it is a FLOW and some of it is a SUBSTRATE. Airflow runs
   before pandas runs before FastAPI — that is a flow. Python, Docker and
   MLflow do not sit anywhere in that order; everything above stands on them.
   Drawing all of it as one left-to-right sequence made the second kind look
   like the first.

   It also collapsed work that is genuinely separate. "Computer vision" as one
   box hides that detection and federated training are different problems with
   different constraints — one is a model on a frame, the other is a training
   topology where the data is not allowed to move. Same for language: adapting
   a model and indexing a corpus for retrieval are not one activity.

   So: three planes that pass work downward, and a substrate underneath them
   that everything runs on. Within a plane, `parallel` says whether the nodes
   are a sequence or alternatives running side by side.

   EVERY TOOL IN `stackGroups` APPEARS HERE EXACTLY ONCE, and
   `utils/stages.test.mjs` fails the test run if that stops being true.
--------------------------------------------------------------------------- */
