import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Blueprint Health Score — pure client-side analysis
// Analyses the returned blueprint JSON to surface architecture quality signals.
// No API call required — instant, deterministic, always runs.
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_STAGES = ['input', 'processing', 'output'];

function analyseBlueprint(blueprint, tools = [], n8nValidation = null) {
  const checks = [];
  let score = 0;
  const maxScore = 100;

  const nodes = blueprint?.nodes || [];
  const edges = blueprint?.edges || [];
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  // ── Check 1: Node count in valid range (5–9) ─────────────────────────────
  if (nodeCount >= 5 && nodeCount <= 9) {
    checks.push({
      label: 'Node Count',
      status: 'pass',
      note: `${nodeCount} nodes — within the 5–9 optimal range.`,
    });
    score += 20;
  } else if (nodeCount > 0) {
    checks.push({
      label: 'Node Count',
      status: 'warn',
      note: `${nodeCount} nodes — outside the recommended 5–9 range. Architecture may be too simple or too complex.`,
    });
    score += 10;
  } else {
    checks.push({ label: 'Node Count', status: 'fail', note: 'No nodes detected in blueprint.' });
  }

  // ── Check 2: Edge connectivity (min edges = nodes - 1 for a connected graph) ──
  const minEdges = Math.max(nodeCount - 1, 0);
  if (edgeCount >= minEdges) {
    checks.push({
      label: 'Edge Connectivity',
      status: 'pass',
      note: `${edgeCount} edges — graph is fully connected.`,
    });
    score += 20;
  } else {
    checks.push({
      label: 'Edge Connectivity',
      status: 'warn',
      note: `${edgeCount} edges but ${nodeCount} nodes — some nodes may be disconnected (isolated).`,
    });
    score += 8;
  }

  // ── Check 3: Stage coverage (input, processing, output all present) ──────
  const presentStages = new Set(nodes.map((n) => (n.data?.stage || '').toLowerCase()));
  const missingStages = REQUIRED_STAGES.filter((s) => !presentStages.has(s));
  if (missingStages.length === 0) {
    checks.push({
      label: 'Stage Coverage',
      status: 'pass',
      note: 'All required stages present: input → processing → output.',
    });
    score += 20;
  } else {
    checks.push({
      label: 'Stage Coverage',
      status: 'warn',
      note: `Missing stages: ${missingStages.join(', ')}. Users may be confused about data flow direction.`,
    });
    score += 6;
  }

  // ── Check 4: Storage stage present ───────────────────────────────────────
  if (presentStages.has('storage')) {
    checks.push({
      label: 'Persistence Layer',
      status: 'pass',
      note: 'Architecture includes a storage/memory node. Data will be retained across runs.',
    });
    score += 15;
  } else {
    checks.push({
      label: 'Persistence Layer',
      status: 'warn',
      note: 'No storage node detected. Architecture is stateless — consider adding a vector store or database node for production deployments.',
    });
    score += 5;
  }

  // ── Check 5: Tool recommendations present ────────────────────────────────
  const toolCount = tools?.length || 0;
  if (toolCount >= 4) {
    checks.push({
      label: 'Tool Coverage',
      status: 'pass',
      note: `${toolCount} specific tool recommendations provided.`,
    });
    score += 15;
  } else if (toolCount > 0) {
    checks.push({
      label: 'Tool Coverage',
      status: 'warn',
      note: `Only ${toolCount} tool recommendation(s). A production stack typically requires 5–8.`,
    });
    score += 7;
  } else {
    checks.push({
      label: 'Tool Coverage',
      status: 'fail',
      note: 'No tool recommendations generated. Blueprint is incomplete.',
    });
  }

  // ── Check 6: Edge labels present ────────────────────────────────────────
  const labelledEdges = edges.filter((e) => e.label && e.label.trim().length > 0);
  if (labelledEdges.length === edgeCount && edgeCount > 0) {
    checks.push({
      label: 'Data Flow Labels',
      status: 'pass',
      note: 'All edges carry a data-type label — flow is self-documenting.',
    });
    score += 10;
  } else if (labelledEdges.length > 0) {
    checks.push({
      label: 'Data Flow Labels',
      status: 'warn',
      note: `${edgeCount - labelledEdges.length} edge(s) lack labels — data types at those connections are ambiguous.`,
    });
    score += 4;
  } else {
    checks.push({
      label: 'Data Flow Labels',
      status: 'fail',
      note: 'No edge labels present — data flow semantics are undocumented.',
    });
  }

  // ── n8n Validation report (appended when present) ────────────────────────
  if (n8nValidation) {
    if (n8nValidation.valid) {
      checks.push({ label: 'n8n Schema Validity', status: 'pass', note: n8nValidation.summary });
    } else if (n8nValidation.repaired) {
      checks.push({ label: 'n8n Schema Validity', status: 'warn', note: n8nValidation.summary });
    } else {
      checks.push({ label: 'n8n Schema Validity', status: 'fail', note: n8nValidation.summary });
    }
  }

  return {
    score: Math.min(Math.round(score), maxScore),
    checks,
  };
}

function StatusIcon({ status }) {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />;
  if (status === 'warn')
    return <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />;
  if (status === 'fail') return <XCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />;
  return <Info className="w-4 h-4 text-textMuted shrink-0 mt-0.5" />;
}

function getScoreColor(score) {
  if (score >= 80) return { text: 'text-[#10b981]', bar: '#10b981', label: 'Excellent' };
  if (score >= 60) return { text: 'text-[#f59e0b]', bar: '#f59e0b', label: 'Good' };
  if (score >= 40) return { text: 'text-[#f97316]', bar: '#f97316', label: 'Fair' };
  return { text: 'text-[#ef4444]', bar: '#ef4444', label: 'Needs Work' };
}

export default function BlueprintHealthScore({ blueprint, tools, n8nValidation }) {
  // Only render in blueprint or n8n tab with valid blueprint data
  if (!blueprint?.nodes?.length) return null;

  const { score, checks } = analyseBlueprint(blueprint, tools, n8nValidation);
  const color = getScoreColor(score);
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;

  return (
    <div className="glass-panel p-6 w-full border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.15)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold tracking-[1px] text-white">Blueprint Health Score</h3>
          <p className="text-xs text-textMuted mt-0.5">
            Automated architecture quality analysis — {checks.length} checks run
          </p>
        </div>

        {/* Score Gauge */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className={`text-4xl font-black tracking-tight ${color.text}`}>{score}</div>
          <div className={`text-[10px] font-bold uppercase tracking-[2px] ${color.text}`}>
            {color.label}
          </div>
          <div className="flex gap-2 mt-1 text-[10px] text-textMuted font-medium">
            <span className="text-[#10b981]">✓ {passCount}</span>
            <span className="text-[#f59e0b]">⚠ {warnCount}</span>
            {failCount > 0 && <span className="text-[#ef4444]">✕ {failCount}</span>}
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color.bar }}
        />
      </div>

      {/* Check List */}
      <div className="flex flex-col gap-2.5">
        {checks.map((check, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <StatusIcon status={check.status} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-white">{check.label}:</span>{' '}
              <span className="text-xs text-textSecondary leading-relaxed">{check.note}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
