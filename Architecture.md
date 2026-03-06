# System Architecture: J. Servo AI Stack Architect

## High-Level Overview

The AI Stack Architect is a decoupled application consisting of a React-based frontend client and an Express-based Node.js backend. The core logic pivots around mathematical ROI calculations and a dual-LLM orchestration pipeline.

## 1. Backend (`/server`)

The backend functions as an orchestrator, receiving unstructured data and transforming it into strategic, visual blueprints and executable workflows.

* **REST API (`index.js`):**
  * `/api/architect` (POST): Generates the ROI, tools, and Flow diagram. Features explicit 120s timeout protection.
  * `/api/compliance` (POST): Checks the generated stack against Data Residency, GDPR, and SOC2 requirements. Features explicit 60s timeout protection.
  * `/api/developer-prompt` (POST): Generates custom scaffolding code for an individual architecture node. Features explicit 60s timeout protection.
  * **Security Layer**: Configures dynamic CORS origins using the `ALLOWED_ORIGINS` environment variable.
* **ROI Engine (`utils/mathEngine.js`):**
  * Replicates mathematical factors (industry multipliers, scope factors, base implementation costs).
  * Calculates 3-year ROI, Break-even periods, and a proprietary **"Confidence Score"** (scaled 20-85). Integrates strict input normalization and guard clauses to prevent silent nullification.
* **AI Orchestrator (`services/orchestrator.js`):**
  * **Phase 1 - Intake (Gemini 2.5 Flash via OpenRouter):** Fast structural parsing of the unstructured request. Includes an automatic dynamic fallback to Groq (`llama-3.3-70b-versatile`) if the primary model fails.
  * **Phase 2 - Execution (Gemini 2.5 Flash via OpenRouter):** The deep-reasoning model designs the strategic stack and native `n8nWorkflow` schemas. Pre-calculated ROI data is piped directly into this model to strictly constrain its financial logic. Includes integrated network retry protection.

## 2. Frontend (`/client`)

The frontend is a strictly styled React Application designed to embed directly into WordPress (Divi Theme) pages.

* **Styling & Theming (`src/index.css`):**
  * Utilizes the `Syne` typography base.
  * Implements the "J. Servo Glassmorphism" system using CSS layer translations (acrylic blurs, gradients, floating borders) ensuring native brand consistency.
* **State Management (`src/hooks/useAIArchitect.js`):**
  * A custom React hook managing `isLoading`, `data`, and `error` parameters across the asynchronous backend fetches.
* **Core UI Components:**
  * `Intake.jsx`: Dual-action form allowing users to select standard visual blueprints or executable **n8n workflow** generation.
  * `ROIResults.jsx`: Dashboards the `mathEngine.js` output and hooks into the backend for dynamic **Enterprise Compliance Auditing**.
  * `FlowCanvas.jsx`: Integrates React Flow to dynamically map JSON to `<JServoNode>` components. Now manages state for **Live Data Flow Simulation** and nested **Developer Prompt Modals**, lifting state explicitly out of the isolated React Flow container.
* **Compilation:**
  * Vite is configured with `vite-plugin-singlefile`, stripping chunked assets to bake the entire UX into a single `dist/index.html` block.
