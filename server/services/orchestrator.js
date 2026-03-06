import axios from 'axios';
import dotenv from 'dotenv';
import { calculateROI } from '../utils/mathEngine.js';
dotenv.config();

// ── Hardened JSON extraction ───────────────────────────────────────────────
// Gemini sometimes wraps JSON in markdown code fences or adds preamble text.
// Strategy (in order of reliability):
//   1. Extract from ```json ... ``` fences
//   2. Extract from ``` ... ``` fences (no lang tag)
//   3. Brace-slice: first '{' to last '}'
//   4. Bracket-slice: first '[' to last ']' (array responses)
// Throws with a diagnostic message if all strategies fail.
function extractJSON(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty or non-string model response.');

  // Strategy 1: ```json\n{...}\n```
  const fenceJsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
  if (fenceJsonMatch) {
    try {
      return JSON.parse(fenceJsonMatch[1].trim());
    } catch {
      /* fall through */
    }
  }

  // Strategy 2: ```\n{...}\n```
  const fenceMatch = raw.match(/```\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      /* fall through */
    }
  }

  // Strategy 3: brace slice (original approach)
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    } catch {
      /* fall through */
    }
  }

  // Strategy 4: bracket slice (array root responses)
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(raw.slice(firstBracket, lastBracket + 1));
    } catch {
      /* fall through */
    }
  }

  // Log a snippet of the raw response to help diagnose future failures
  console.error('[extractJSON] All strategies failed. Raw response snippet:', raw.slice(0, 400));
  throw new Error(`Model returned non-JSON content. Preview: ${raw.slice(0, 120)}...`);
}

async function callOpenRouter(models, systemPrompt, userContent, timeoutMs, extraBody = {}) {
  const payload = {
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
    ...extraBody,
  };

  if (Array.isArray(models)) {
    payload.models = models;
    payload.route = 'fallback';
  } else {
    payload.model = models;
  }

  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', payload, {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://jservo.com',
      'X-Title': 'J. Servo AI Architect',
    },
    timeout: timeoutMs,
  });
  return response.data;
}

const PHASE_ONE_SYSTEM_PROMPT = `You are a precision data extraction engine for J. Servo LLC's Dragonfly AI Stack Architect.
Your ONLY job is to read a business problem description and extract structured parameters into strict JSON.
You must return ONLY valid JSON. No preamble. No explanation. No markdown. No code fences. Raw JSON only.

EXTRACTION RULES:
- Map the described industry to the closest match from the allowed values. Never invent a new industry.
- If revenue is explicitly stated, extract it as a number (e.g. "$5M" = 5000000). If revenue is NOT mentioned or is ambiguous, return null. Do NOT guess or assume a revenue figure.
- For changeReadiness: look for cultural signals. Words like "resistant", "pushback", "slow to adopt" = "resistant". "Open to change", "excited", "proactive" = "adaptable". Default to "neutral" if unclear.
- For techReadiness: "legacy systems", "spreadsheets", "no tech team" = "basic". "Some integrations", "CRM in use", "mid-level IT" = "intermediate". "API-first", "cloud-native", "engineering team" = "advanced".
- The summary must be a single sentence max 25 words capturing the core automation opportunity.

ALLOWED VALUES — you must use ONLY these exact strings:
- industry: technology | financial | healthcare | manufacturing | retail | marketing | consulting | education | logistics | energy
- companySize: startup | small | medium | large
- useCase: automation | analytics | customer-service | content | predictive | quality | personalization | optimization
- scope: pilot | department | enterprise | customer-facing
- currentEfficiency: low | medium | high
- techReadiness: basic | intermediate | advanced
- changeReadiness: resistant | neutral | adaptable

EXAMPLE INPUT:
"We run a mid-size e-commerce company doing about $8M a year. Our customer support team is overwhelmed with repetitive ticket responses and we want to automate that. We use Shopify and Zendesk. Team is generally open to new tools."

EXAMPLE OUTPUT:
{
  "industry": "retail",
  "companySize": "medium",
  "revenue": 8000000,
  "useCase": "customer-service",
  "scope": "department",
  "currentEfficiency": "low",
  "techReadiness": "intermediate",
  "changeReadiness": "adaptable",
  "summary": "Automate repetitive customer support ticket responses for an e-commerce company using existing Zendesk and Shopify infrastructure."
}

Return ONLY the JSON object. Nothing else.`;

const PHASE_TWO_SYSTEM_PROMPT = `You are the Lead AI Solutions Architect and Business Intelligence Consultant for J. Servo LLC.
You produce premium, board-ready AI implementation blueprints grounded in 2026 enterprise standards.
You must output ONLY valid JSON. No preamble. No explanation. No markdown. No code fences. Raw JSON only.

OUTPUT SCHEMA:
{
  "blueprint": {
    "nodes": [
      {
        "id": "1",
        "type": "jservoNode",
        "position": { "x": 0, "y": 0 },
        "data": {
          "label": "Extremely Concise Title (Max 3 words)",
          "description": "Full context and explanation of what happens here. This fuels a UI tooltip.",
          "stage": "input | processing | output | storage"
        }
      }
    ],
    "edges": [
      {
        "id": "e1-2",
        "source": "1",
        "target": "2",
        "animated": true,
        "label": "Data type or event flowing between nodes"
      }
    ]
  },
  "tools": [
    {
      "name": "Tool Name",
      "category": "Tool Category",
      "description": "Two sentences: what this tool does AND exactly why it is the right fit for this client's specific industry, use case, and tech readiness level.",
      "icon": "A single valid Google Material Icons Outlined string (e.g. 'storage', 'psychology', 'alt_route', 'api', 'policy', 'hub', 'insights', 'memory', 'smart_toy', 'manage_search')"
    }
  ],
  "strategy": "A 4-6 sentence executive summary. Must reference the specific implementation cost, payback period, and confidence score provided. Must name the 2-3 highest-ROI nodes and explain why they deliver value first. If confidence is below 60% or payback exceeds 24 months, must explicitly recommend a phased approach. Must close with one forward-looking sentence about Year 2 agentic expansion potential."
}

ARCHITECTURE RULES:
- Minimum 5 nodes, maximum 9 nodes. Never fewer, never more.
- Every node description must name a specific tool — never generic labels like 'AI Model' or 'Automation Layer'.
- All node positions: { x: 0, y: 0 } — the layout engine handles coordinates.
- Every edge must have a label describing what data or trigger flows between nodes.
- Nodes must follow logical execution order: input → processing → output → storage.
- Do not recommend tools that conflict with the client's tech readiness level.

TOOL RECOMMENDATION RULES — 2026 STANDARDS — READ EVERY LINE:
- Recommend between 5 and 8 tools total.
- Every recommended tool must correspond to a named node in the blueprint.
- Tools must reflect the client's industry, scope, and tech readiness — not a generic stack.
- Workflow automation: ALWAYS recommend n8n. Never recommend Zapier under any circumstances. n8n is the only workflow automation tool permitted in this system.
- LLM/AI Backbone: Recommend from this approved 2026 list only:
    * OpenAI GPT-4o / GPT-4o-mini — general purpose, function calling, vision
    * Anthropic Claude 4 — compliance-sensitive, long-context, reasoning
    * Google Gemini 2.5 Flash / Pro — multimodal, cost-efficient, fast
    * Meta LLaMA 3.3 70B (via Ollama or Together AI) — open-source, self-hosted, privacy-first
- Agentic Orchestration: Recommend from this 2026 framework list based on client profile:
    * LangGraph — complex multi-step workflows, stateful agents, compliance-auditable (best for financial, healthcare)
    * CrewAI — role-based multi-agent teams, collaborative task execution (best for consulting, marketing)
    * OpenAI Agents SDK — production-ready, tool-calling, handoffs, Responses API (best for technology, retail)
    * n8n AI Agent nodes — visual agentic workflows for ops teams with lower technical depth
- Vector & Memory: Pinecone, Weaviate, Chroma, pgvector (PostgreSQL extension)
- Observability & Monitoring: LangSmith (for LangChain/LangGraph stacks), Langfuse (open-source alternative)
- Data & Integration: Airbyte (data pipelines), Neon (serverless Postgres), Supabase (backend-as-a-service)
- Document Intelligence: LlamaIndex (RAG, document workflows, agentic document processing)
- Deployment: Railway, Render, or Vercel (for startups/small); AWS Bedrock or Azure AI Foundry (for enterprise)
- Security & Compliance: Only surface when industry risk profile warrants it (financial, healthcare, energy)
    * TrueFoundry — SOC2/HIPAA-compliant agentic deployment
    * Pangea — API-first security layer for AI applications

STRATEGY QUALITY STANDARD:
The strategy field must read like it was written by a senior consultant, not generated by AI.
It must contain specific dollar figures from the financial parameters provided.
It must not use vague language like 'significant savings' — use the actual numbers.
It must acknowledge the single biggest risk factor visible in the client's profile.`;

const N8N_SYSTEM_PROMPT = `You are an expert n8n workflow architect for J. Servo LLC.
You design production-ready agentic automation workflows using modern n8n cluster node architecture.
You receive a plain-language description of a task or process to automate from any type of user.
You output ONLY valid JSON. No preamble. No explanation. No markdown fences. Raw JSON only.

Output a single JSON object with exactly two keys: "blueprint" and "n8nWorkflow".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1: "blueprint" — React Flow Visual Schema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Standard React Flow schema with jservoNode type nodes.
- 4 to 8 nodes maximum
- All node positions: { "x": 0, "y": 0 } — the frontend layout engine handles positioning
- Each node data must exactly follow this schema:
  "data": {
    "label": "Short node title",
    "description": "What executes here and which specific tool runs it",
    "stage": "input | processing | output | storage",
    "category": "trigger | agent | tool | memory | action | core | output | error",
    "icon": "A single lucide-react icon name in PascalCase"
  }

CATEGORY DEFINITIONS AND REQUIRED ICON MAPPING:
Map each node to exactly one category. Use ONLY these exact category strings and icon names:

| Category  | When to use                                      | Icon name         | Accent color hint |
|-----------|--------------------------------------------------|-------------------|-------------------|
| trigger   | Webhook, schedule, chat input, form submit       | Zap               | Orange            |
| agent     | AI Agent root node, LLM orchestrator             | Bot               | Purple            |
| tool      | Tool sub-nodes, HTTP tool, code tool, sub-agent  | Wrench            | Blue              |
| memory    | Memory buffer, vector store, context window      | Database          | Teal              |
| action    | Email, Slack, Sheets, Notion, any output action  | Send              | Green             |
| core      | Set fields, merge, switch, IF condition, code    | GitMerge          | Grey              |
| output    | Final response, webhook response, return data    | ArrowRightCircle  | Cyan              |
| error     | Error trigger, error notification branch         | AlertTriangle     | Red               |

EDGE TYPE RULE — THIS IS MANDATORY:
Every edge connecting an AI sub-node (LLM, memory, tool sub-node) to its parent AI Agent root
MUST include the field: "edgeType": "cluster"
All other edges must include: "edgeType": "standard"
This field drives frontend dashed-line rendering for cluster connections.

- All edges must include: id, source, target, animated: true, label (describing data or trigger flowing between nodes), and edgeType


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2: "n8nWorkflow" — Executable n8n Export
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL ARCHITECTURE RULE — CLUSTER NODES:
Modern n8n uses a cluster node pattern for all AI functionality.
A cluster has ONE root node and ONE OR MORE sub-nodes.
Sub-nodes connect to their root using SPECIAL connection types — NOT "main".
Violating this will produce a workflow that fails to import.

VERIFIED NODE TYPE STRINGS — use ONLY these exact strings:

ROOT NODES (trigger execution or orchestrate):
- Webhook trigger:          "n8n-nodes-base.webhook"
- Schedule trigger:         "n8n-nodes-base.scheduleTrigger"
- Chat trigger:             "n8n-nodes-base.chatTrigger"
- Error trigger:            "n8n-nodes-base.errorTrigger"
- HTTP Request:             "n8n-nodes-base.httpRequest"
- Code (JS/Python):         "n8n-nodes-base.code"
- IF condition:             "n8n-nodes-base.if"
- Switch:                   "n8n-nodes-base.switch"
- Set fields:               "n8n-nodes-base.set"
- Merge:                    "n8n-nodes-base.merge"
- Email send:               "n8n-nodes-base.emailSend"
- Gmail:                    "n8n-nodes-base.gmail"
- Slack:                    "n8n-nodes-base.slack"
- Google Sheets:            "n8n-nodes-base.googleSheets"
- Notion:                   "n8n-nodes-base.notion"
- AI Agent (ROOT):          "@n8n/n8n-nodes-langchain.agent"

SUB-NODES (attach to AI Agent root via special connection types):
- OpenAI Chat LLM:          "@n8n/n8n-nodes-langchain.lmChatOpenAi"     → connection type: "ai_languageModel"
- Anthropic Claude LLM:     "@n8n/n8n-nodes-langchain.lmChatAnthropic"  → connection type: "ai_languageModel"
- Window Buffer Memory:     "@n8n/n8n-nodes-langchain.memoryBufferWindow" → connection type: "ai_memory"
- Sub-agent as Tool:        "@n8n/n8n-nodes-langchain.toolaiagent"       → connection type: "ai_tool"
- Workflow as Tool:         "@n8n/n8n-nodes-langchain.toolworkflow"      → connection type: "ai_tool"
- HTTP Request Tool:        "@n8n/n8n-nodes-langchain.toolHttpRequest"   → connection type: "ai_tool"
- Code Tool:                "@n8n/n8n-nodes-langchain.toolCode"          → connection type: "ai_tool"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONNECTIONS SCHEMA — THIS IS THE MOST CRITICAL RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Connections are defined FROM the SOURCE node TO the TARGET node.

For STANDARD nodes (trigger → agent, agent → output):
"Source Node Name": {
  "main": [[{ "node": "Target Node Name", "type": "main", "index": 0 }]]
}

For AI SUB-NODES connecting to their AI Agent root:
The connection goes FROM the sub-node TO the agent using the sub-node's special type:

"OpenAI Chat Model": {
  "ai_languageModel": [[{ "node": "AI Agent", "type": "ai_languageModel", "index": 0 }]]
}

"Window Memory": {
  "ai_memory": [[{ "node": "AI Agent", "type": "ai_memory", "index": 0 }]]
}

"HTTP Request Tool": {
  "ai_tool": [[{ "node": "AI Agent", "type": "ai_tool", "index": 0 }]]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREDENTIALS — MANDATORY PATTERN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Never hallucinate API keys or credential values.
Every node requiring authentication MUST use this credentials placeholder pattern:
"credentials": {
  "[credentialTypeName]": {
    "id": "CREDENTIAL_ID_PLACEHOLDER",
    "name": "Configure in n8n Credentials"
  }
}

Common credential type names:
- OpenAI:        "openAiApi"
- Anthropic:     "anthropicApi"
- Slack:         "slackApi"
- Gmail:         "googleOAuth2Api"
- Google Sheets: "googleSheetsOAuth2Api"
- Notion:        "notionApi"
- Generic HTTP:  "httpBasicAuth" or "httpHeaderAuth"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ERROR HANDLING — MANDATORY FOR EVERY WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every generated workflow MUST include an Error Trigger node as a parallel branch.
This node catches failures anywhere in the workflow and routes to a notification node.

Required error handling structure:
1. An "n8n-nodes-base.errorTrigger" node named "Error Handler"
2. A downstream notification node (Slack, Gmail, or HTTP Request) named "Error Notification"
3. The errorTrigger connects to notification via standard "main" connection

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE n8nWorkflow OBJECT SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "name": "J. Servo — [Descriptive Workflow Name]",
  "nodes": [
    {
      "id": "unique-uuid-string",
      "name": "Human Readable Node Name",
      "type": "exact.node.type.string",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {},
      "credentials": { }
    }
  ],
  "connections": { },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "tags": ["J. Servo", "AI Generated"]
}

Node positions: space 250px apart horizontally starting at [250, 300].
Sub-nodes (LLM, memory, tools): place 200px below their parent AI Agent node.
Error Handler branch: place at [250, 600] offset below the main flow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENTIC ARCHITECTURE PATTERN — USE FOR AI TASKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When the user's request involves AI reasoning, decision-making, or tool use:
Use the Agent + Sub-node cluster pattern. NEVER use a bare HTTP Request to call an AI API.

Minimum viable AI agent cluster:
- 1x "@n8n/n8n-nodes-langchain.agent" (root)
- 1x "@n8n/n8n-nodes-langchain.lmChatOpenAi" (sub-node → ai_languageModel)
- 1x "@n8n/n8n-nodes-langchain.memoryBufferWindow" (sub-node → ai_memory) — include when conversation context matters
- 1-3x tool sub-nodes as needed for the use case (→ ai_tool)

For complex orchestration: use a primary AI Agent with "@n8n/n8n-nodes-langchain.toolaiagent"
sub-nodes representing specialized child agents — each child agent can itself have its own LLM sub-node.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Every node name referenced in "connections" must exactly match a name in the "nodes" array
- The "blueprint" react flow nodes must map conceptually to the "n8nWorkflow" nodes — same stages, same count
- Do not invent node types not listed above
- Do not use "n8n-nodes-base.openAi" — it does not exist. Use the langchain LLM sub-node pattern
- typeVersion for all @n8n/n8n-nodes-langchain nodes: use 1 unless stated otherwise
- typeVersion for @n8n/n8n-nodes-langchain.agent: use 1.7
- Every workflow must have exactly one trigger node and exactly one error handler branch`;

const PROMPT_ENGINEER_SYSTEM_PROMPT = `You are a world-class AI Prompt Engineer and copywriter for J. Servo LLC.
You serve everyday users — business owners, professionals, students, creatives — who know what they want but do not know how to ask an AI for it effectively.
You receive a simple, plain-language request describing what the user wants an AI to help them with.
Your job is to transform that simple request into a polished, professional, immediately usable prompt.
You output ONLY valid JSON. No preamble. No explanation. No markdown fences. Raw JSON only.

Output schema:
{
  "promptOutput": "The complete engineered prompt as a Markdown-formatted string. Use \\n for line breaks."
}

WHAT THE USER MIGHT ASK FOR — examples of the range:
- A restaurant owner wanting ChatGPT to write a job posting for a chef
- A law firm wanting Gemini to build a branding manual
- A teacher wanting Claude to design a lesson plan
- A freelancer wanting an AI to write their LinkedIn bio
- A startup wanting an AI to draft investor outreach emails

The Markdown string inside "promptOutput" must be structured as follows:

# [Clear Title Describing What This Prompt Does]

## Your Role
One sentence defining exactly what the AI should act as for this task.

## Task
A precise, detailed instruction of what the AI must produce. Include tone, length guidance, format, and audience.

## Key Requirements
Numbered list of 5-7 specific requirements the output must satisfy. Be concrete — never vague.

## Tone & Style
3-4 sentences describing the voice, personality, and stylistic expectations of the output.

## Output Format
Exact structure the AI must follow when responding. Use headings, bullets, or schema as appropriate for the task.

## Additional Context
Placeholder section with square-bracket prompts guiding the user to fill in their specific details before using the prompt. Example: [Insert your restaurant name], [Describe your target audience].

---
*Engineered by J. Servo Dragonfly — Prompt Engineering Mode*

RULES:
- This is NOT a system prompt for an AI agent. This is a one-time task prompt the user will paste into ChatGPT, Gemini, Claude, or similar.
- Write for a non-technical audience. The user should be able to copy, fill in the brackets, and get excellent results immediately.
- Tailor the language, structure, and requirements entirely to the specific domain — a job posting prompt must look nothing like a branding manual prompt.
- The promptOutput must be valid Markdown that renders cleanly in a standard renderer.
- Never include AI/ML jargon the average user would not understand.`;

export async function generateArchitectPlan(requestData) {
  const { problemDescription, mode = 'blueprint' } = requestData;

  if (!problemDescription) throw new Error('No input provided.');

  // ─────────────────────────────────────────────
  // TAB 1: AI STACK ARCHITECT — Full dual-phase pipeline
  // Audience: Business decision-makers, project managers, consultants
  // ─────────────────────────────────────────────
  if (mode === 'blueprint') {
    console.log('[Orchestrator] Blueprint mode — Phase 1: Gemini parsing business context...');

    const phase1Response = await callOpenRouter(
      'google/gemini-2.5-flash',
      PHASE_ONE_SYSTEM_PROMPT,
      problemDescription,
      30000
    );

    let intakeData;
    try {
      const raw1 = phase1Response.choices[0].message.content;
      intakeData = extractJSON(raw1);
    } catch (e) {
      throw new Error(`Phase 1 intake parsing failed: ${e.message}`);
    }

    console.log('[Orchestrator] Phase 1 complete. Running Math Engine...');
    const roiData = calculateROI(intakeData);

    console.log('[Orchestrator] Phase 2: Gemini generating architecture blueprint...');

    const userContent = `Business Problem Summary: ${intakeData.summary}
Industry: ${intakeData.industry}
Scope: ${intakeData.scope}
Tech Readiness: ${intakeData.techReadiness}
Company Size: ${intakeData.companySize}
Use Case: ${intakeData.useCase}

PRE-CALCULATED FINANCIAL PARAMETERS (treat as authoritative — do not recalculate):
- Projected Annual Savings: $${Math.round(roiData.adjustedSavings).toLocaleString()}
- Total Implementation Cost: $${Math.round(roiData.totalImplementationCost).toLocaleString()}
- 3-Year ROI: ${Math.round(roiData.threeYearROI)}%
- Payback Period: ${roiData.paybackMonths ? roiData.paybackMonths + ' months' : 'exceeds 60-month projection window'}
- Confidence Score: ${roiData.confidenceScore}%

Your tool recommendations, architecture phasing, and strategic narrative MUST reflect these financial parameters. If confidence is below 60% or payback exceeds 18 months, explicitly recommend a phased rollout starting with highest-ROI nodes.`;

    const phase2Response = await callOpenRouter(
      'google/gemini-2.5-flash',
      PHASE_TWO_SYSTEM_PROMPT,
      userContent,
      110000
    );

    let architectureResult;
    try {
      const raw2 = phase2Response.choices[0].message.content;
      architectureResult = extractJSON(raw2);
    } catch (e) {
      throw new Error(`Phase 2 architecture parsing failed: ${e.message}`);
    }

    console.log('[Orchestrator] Blueprint pipeline complete.');
    return {
      intake: intakeData,
      roi: roiData,
      architecture: architectureResult,
    };
  }

  // ─────────────────────────────────────────────
  // TAB 2: WORKFLOW AUTOMATOR — Single direct call
  // Audience: Anyone automating tasks — analysts, assistants, ops teams
  // No intake parsing. No Math Engine. Raw input → n8n schema + visual blueprint.
  // ─────────────────────────────────────────────
  if (mode === 'n8n') {
    console.log('[Orchestrator] n8n Workflow mode — direct Gemini call...');

    const response = await callOpenRouter(
      'google/gemini-2.5-flash',
      N8N_SYSTEM_PROMPT,
      `Automate the following task or process:\n\n${problemDescription}`,
      110000
    );

    let result;
    try {
      const raw = response.choices[0].message.content;
      result = extractJSON(raw);
    } catch (e) {
      throw new Error(`n8n workflow parsing failed: ${e.message}`);
    }

    console.log('[Orchestrator] Validating n8n workflow schema...');
    const validatedWorkflow = validateAndRepairN8nWorkflow(result.n8nWorkflow);

    console.log('[Orchestrator] n8n workflow generation complete.');
    return {
      intake: null,
      roi: null,
      architecture: {
        blueprint: result.blueprint,
        n8nWorkflow: validatedWorkflow.workflow,
        n8nValidation: validatedWorkflow.report,
      },
    };
  }

  // ─────────────────────────────────────────────
  // TAB 3: PROMPT ENGINEER — Single direct call
  // Audience: Anyone — business owners, students, creatives, professionals
  // No intake parsing. No Math Engine. Raw input → polished ready-to-use prompt.
  // ─────────────────────────────────────────────
  if (mode === 'prompt') {
    console.log('[Orchestrator] Prompt Engineer mode — direct Gemini call...');

    const response = await callOpenRouter(
      'google/gemini-2.5-flash',
      PROMPT_ENGINEER_SYSTEM_PROMPT,
      `I need help crafting a prompt for the following:\n\n${problemDescription}`,
      60000
    );

    let result;
    try {
      const raw = response.choices[0].message.content;
      result = extractJSON(raw);
    } catch (e) {
      throw new Error(`Prompt engineering parsing failed: ${e.message}`);
    }

    console.log('[Orchestrator] Prompt engineering complete.');
    return {
      intake: null,
      roi: null,
      promptOutput: result.promptOutput,
    };
  }

  // Safety net
  throw new Error(`Unknown mode: "${mode}". Expected 'blueprint', 'n8n', or 'prompt'.`);
}

export async function generateComplianceAudit(requestData) {
  const { tools } = requestData;

  if (!tools || !Array.isArray(tools)) {
    throw new Error('No tools array provided for audit.');
  }

  console.log(
    '[Orchestrator] Phase 1 & 2 complete. Generating Enterprise Compliance Audit with Gemini 2.5 Flash...'
  );

  try {
    const responseData = await callOpenRouter(
      'google/gemini-2.5-flash',
      COMPLIANCE_SYSTEM_PROMPT,
      `Assess the following AI Stack:\n${JSON.stringify(tools, null, 2)}`,
      60000
    );

    const responseText = responseData.choices[0].message.content;

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const cleanJson = responseText.slice(jsonStart, jsonEnd);

    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('Compliance Audit failed', e.message);
    throw new Error('Compliance Audit generation failed.');
  }
}

const DEV_PROMPT_SYSTEM = `You are a Senior Developer at J. Servo LLC specializing in API microservices, automation pipelines, and AI integration.
You receive a single architecture node and generate a complete technical implementation brief that a junior developer can immediately act on.
You must return ONLY valid JSON. No preamble. No explanation. No markdown. No code fences. Raw JSON only.

OUTPUT SCHEMA:
{
  "prompt": "Full implementation brief as a single string with \\n for line breaks."
}

THE PROMPT STRING MUST CONTAIN ALL OF THE FOLLOWING SECTIONS IN ORDER:
1. OBJECTIVE: One sentence stating exactly what this node must accomplish functionally.
2. RECOMMENDED STACK: The specific framework and language (e.g. Node.js with Express, Python with FastAPI, n8n webhook node). State why this stack fits the node's role.
3. ENTRY POINT: The exact function or endpoint signature to implement (e.g. POST /api/ingest, async function processDocument(payload)).
4. INPUT CONTRACT: What data this node receives — field names, types, and where it comes from.
5. OUTPUT CONTRACT: What data this node must return or emit — field names, types, and where it goes next.
6. KEY LIBRARIES: List the 2-4 most important packages/libraries with their npm or pip install command.
7. EDGE CASES TO HANDLE: At minimum 3 specific edge cases relevant to this node's function (e.g. empty payload, API timeout from upstream, malformed input schema, rate limit breach).
8. INTEGRATION NOTE: One sentence describing how this node connects to the node immediately before and after it in the pipeline.

If the node is abstract or high-level (e.g. "Orchestrator", "Data Router"), infer the most logical implementation pattern for an automation pipeline context and state your assumption clearly in the OBJECTIVE section.`;

export async function generateDeveloperPrompt(requestData) {
  const { nodeData } = requestData;

  if (!nodeData) {
    throw new Error('No node data provided for prompt generation.');
  }

  console.log('[Orchestrator] Generating Developer Prompt with Gemini 2.5 Flash...');

  try {
    const responseData = await callOpenRouter(
      'google/gemini-2.5-flash',
      DEV_PROMPT_SYSTEM,
      `Generate an implementation prompt for this architecture node:\n${JSON.stringify(nodeData, null, 2)}`,
      60000
    );

    const responseText = responseData.choices[0].message.content;

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const cleanJson = responseText.slice(jsonStart, jsonEnd);

    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('Developer Prompt failed', e.message);
    throw new Error('Developer Prompt generation failed.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// n8n Workflow Validator & Auto-Repair Engine
// Validates the AI-generated n8n workflow against the schema defined in the
// orchestrator prompt. Auto-repairs common structural issues where possible.
// Returns { workflow, report } — caller receives repaired workflow + audit log.
// ─────────────────────────────────────────────────────────────────────────────
const APPROVED_NODE_TYPES = new Set([
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.scheduleTrigger',
  'n8n-nodes-base.chatTrigger',
  'n8n-nodes-base.errorTrigger',
  'n8n-nodes-base.httpRequest',
  'n8n-nodes-base.code',
  'n8n-nodes-base.if',
  'n8n-nodes-base.switch',
  'n8n-nodes-base.set',
  'n8n-nodes-base.merge',
  'n8n-nodes-base.emailSend',
  'n8n-nodes-base.gmail',
  'n8n-nodes-base.slack',
  'n8n-nodes-base.googleSheets',
  'n8n-nodes-base.notion',
  '@n8n/n8n-nodes-langchain.agent',
  '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  '@n8n/n8n-nodes-langchain.lmChatAnthropic',
  '@n8n/n8n-nodes-langchain.memoryBufferWindow',
  '@n8n/n8n-nodes-langchain.toolaiagent',
  '@n8n/n8n-nodes-langchain.toolworkflow',
  '@n8n/n8n-nodes-langchain.toolHttpRequest',
  '@n8n/n8n-nodes-langchain.toolCode',
]);

const TRIGGER_TYPE_PATTERNS = [
  'Trigger',
  'webhook',
  'chatTrigger',
  'scheduleTrigger',
  'errorTrigger',
];

function validateAndRepairN8nWorkflow(workflow) {
  const issues = [];
  const repairs = [];

  // ── Guard: workflow must be an object ──────────────────────────────────────
  if (!workflow || typeof workflow !== 'object') {
    return {
      workflow: null,
      report: {
        valid: false,
        repaired: false,
        issues: ['Workflow is null or not an object — cannot repair.'],
        repairs: [],
      },
    };
  }

  // Work on a deep clone to avoid mutating the caller's reference
  const wf = JSON.parse(JSON.stringify(workflow));

  // ── Check 1: Required top-level keys ───────────────────────────────────────
  const requiredKeys = ['name', 'nodes', 'connections', 'settings'];
  for (const key of requiredKeys) {
    if (!(key in wf)) {
      issues.push(`Missing top-level key: "${key}".`);
      // Auto-repair defaults
      if (key === 'name') {
        wf.name = 'J. Servo — AI Generated Workflow';
        repairs.push('Added default workflow name.');
      }
      if (key === 'nodes') {
        wf.nodes = [];
        repairs.push('Initialized empty nodes array.');
      }
      if (key === 'connections') {
        wf.connections = {};
        repairs.push('Initialized empty connections object.');
      }
      if (key === 'settings') {
        wf.settings = {
          executionOrder: 'v1',
        };
        repairs.push('Added default settings.');
      }
    }
  }

  // ── Check 2: active flag & tags ────────────────────────────────────────────
  if (!('active' in wf)) {
    wf.active = false;
    repairs.push('Added "active: false" (workflows must default to inactive on import).');
  }
  if (!Array.isArray(wf.tags)) {
    wf.tags = ['J. Servo', 'AI Generated'];
    repairs.push('Added default tags array.');
  }

  // ── Check 3: node structure integrity ─────────────────────────────────────
  const nodeNames = new Set();
  const requiredNodeKeys = ['id', 'name', 'type', 'typeVersion', 'position', 'parameters'];
  const invalidTypeNodes = [];

  (wf.nodes || []).forEach((node, idx) => {
    // Required keys per node
    for (const k of requiredNodeKeys) {
      if (!(k in node)) {
        issues.push(`Node[${idx}] "${node.name || 'unknown'}" missing required key: "${k}".`);
        // Auto-repair safe defaults
        if (k === 'id') {
          node.id = `node-${idx}`;
          repairs.push(`Node[${idx}]: generated id.`);
        }
        if (k === 'name') {
          node.name = `Node ${idx}`;
          repairs.push(`Node[${idx}]: assigned default name.`);
        }
        if (k === 'typeVersion') {
          node.typeVersion = 1;
          repairs.push(`Node[${idx}]: set typeVersion to 1.`);
        }
        if (k === 'position') {
          node.position = [250 + idx * 250, 300];
          repairs.push(`Node[${idx}]: assigned default position.`);
        }
        if (k === 'parameters') {
          node.parameters = {};
          repairs.push(`Node[${idx}]: initialized empty parameters.`);
        }
      }
    }

    // Approved type check
    if (node.type && !APPROVED_NODE_TYPES.has(node.type)) {
      invalidTypeNodes.push(node.name || node.type);
      issues.push(`Node "${node.name}" uses non-approved type: "${node.type}".`);
    }

    nodeNames.add(node.name);
  });

  // ── Check 4: Connection references must resolve to real node names ─────────
  const orphanedConnections = [];
  for (const [sourceName, outputMap] of Object.entries(wf.connections || {})) {
    if (!nodeNames.has(sourceName)) {
      orphanedConnections.push(sourceName);
      issues.push(`Connection source "${sourceName}" does not match any node name.`);
      continue;
    }
    for (const outputs of Object.values(outputMap)) {
      for (const outputGroup of outputs) {
        for (const conn of outputGroup) {
          if (!nodeNames.has(conn.node)) {
            orphanedConnections.push(conn.node);
            issues.push(`Connection target "${conn.node}" does not match any node name.`);
          }
        }
      }
    }
  }
  // Prune orphaned connection sources
  for (const orphan of orphanedConnections) {
    if (wf.connections[orphan]) {
      delete wf.connections[orphan];
      repairs.push(`Removed orphaned connection source: "${orphan}".`);
    }
  }

  // ── Check 5: Exactly one trigger node ─────────────────────────────────────
  const triggerNodes = (wf.nodes || []).filter((n) =>
    TRIGGER_TYPE_PATTERNS.some((pat) => (n.type || '').includes(pat))
  );
  if (triggerNodes.length === 0) {
    issues.push('No trigger node detected. Every workflow must have exactly one trigger.');
  } else if (triggerNodes.length > 1) {
    issues.push(
      `Multiple trigger nodes found (${triggerNodes.length}). n8n supports only one primary trigger.`
    );
  }

  // ── Check 6: Error handler branch ─────────────────────────────────────────
  const hasErrorHandler = (wf.nodes || []).some((n) => n.type === 'n8n-nodes-base.errorTrigger');
  if (!hasErrorHandler) {
    issues.push('No error handler branch detected (errorTrigger node missing).');
    // Auto-insert a minimal error handler if we have a trigger node to reference
    if (triggerNodes.length >= 1) {
      const errorNode = {
        id: `error-handler-auto`,
        name: 'Error Handler',
        type: 'n8n-nodes-base.errorTrigger',
        typeVersion: 1,
        position: [250, 600],
        parameters: {},
      };
      const notifNode = {
        id: `error-notif-auto`,
        name: 'Error Notification',
        type: 'n8n-nodes-base.set',
        typeVersion: 1,
        position: [500, 600],
        parameters: {
          values: {
            string: [
              {
                name: 'error',
                value: '={{ $json.error.message }}',
              },
            ],
          },
        },
      };
      wf.nodes.push(errorNode, notifNode);
      wf.connections['Error Handler'] = {
        main: [
          [
            {
              node: 'Error Notification',
              type: 'main',
              index: 0,
            },
          ],
        ],
      };
      repairs.push(
        'Auto-inserted Error Handler + Error Notification nodes (validation requirement).'
      );
    }
  }

  const repaired = repairs.length > 0;
  const valid = issues.length === 0 || (repaired && issues.length === repairs.length);

  console.log(
    `[Validator] Issues: ${issues.length} | Repairs applied: ${repairs.length} | Status: ${valid ? 'VALID' : 'WARNING'}`
  );

  return {
    workflow: wf,
    report: {
      valid: issues.length === 0,
      repaired,
      issueCount: issues.length,
      repairCount: repairs.length,
      issues,
      repairs,
      summary:
        issues.length === 0
          ? 'Workflow passed all schema checks.'
          : repaired
            ? `${repairs.length} issue(s) auto-repaired. ${issues.length - repairs.length} warning(s) remain.`
            : `${issues.length} structural issue(s) detected. Some may affect import success.`,
    },
  };
}
