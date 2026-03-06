import dagre from 'dagre';
import { toPng } from 'html-to-image';
import {
  BarChart2,
  BrainCircuit,
  Cpu,
  Database,
  Download,
  FileJson,
  FileText,
  GitBranch,
  Globe,
  ImageDown,
  Layers,
  LayoutTemplate,
  Lock,
  MessageSquare,
  Network,
  Search,
  Settings,
  Shield,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import N8nNode from './N8nNode';

// Map conceptual node stages/words to Lucide icons
const getIconForNode = (data) => {
  const text = ((data.label || '') + ' ' + (data.description || '')).toLowerCase();

  // Stage-based fallbacks (strongest signal — layout system sets these)
  if (data.stage === 'storage') return <Database size={16} />;
  if (data.stage === 'input') return <LayoutTemplate size={16} />;
  if (data.stage === 'output') return <Download size={16} />;

  // Semantic keyword groups — ordered by specificity
  if (text.match(/analytic|dashboard|insight|metric|report|bi\b|forecast/))
    return <BarChart2 size={16} />;
  if (text.match(/database|storage|vector|pinecone|chroma|postgres|memory/))
    return <Database size={16} />;
  if (text.match(/crm|customer|contact|user|team|persona|audience/)) return <Users size={16} />;
  if (text.match(/document|pdf|file|contract|invoice|report|content/))
    return <FileText size={16} />;
  if (text.match(/api|webhook|http|fetch|rest|graphql|integration|trigger/))
    return <Zap size={16} />;
  if (text.match(/ai|llm|model|gemini|gpt|claude|reasoning|llama|inference/))
    return <BrainCircuit size={16} />;
  if (text.match(/search|find|query|retriev|lookup|rag|semantic/)) return <Search size={16} />;
  if (text.match(/message|chat|email|slack|support|notify|comm/))
    return <MessageSquare size={16} />;
  if (text.match(/security|auth|permission|oauth|access|identity/)) return <Lock size={16} />;
  if (text.match(/compliance|gdpr|hipaa|soc|audit|policy|risk/)) return <Shield size={16} />;
  if (text.match(/infra|cloud|server|deploy|compute|gpu|cpu|container/)) return <Cpu size={16} />;
  if (text.match(/network|integration|pipeline|orchestrat|workflow|route/))
    return <Network size={16} />;
  if (text.match(/logic|process|condition|transform|enrich|filter/)) return <GitBranch size={16} />;
  if (text.match(/setting|config|admin|manage|control/)) return <Settings size={16} />;
  if (text.match(/web|site|scrape|browse|url|external|public/)) return <Globe size={16} />;

  // Stage-based processing fallback
  if (data.stage === 'processing') return <GitBranch size={16} />;

  return <Layers size={16} />; // Ultimate default
};

const getLayoutedElements = (nodes, edges, direction = 'TB', nodeWidth = 320, nodeHeight = 180) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 80, // Tightened vertical space between ranks
    nodesep: 60, // Tightened horizontal space between nodes
    edgesep: 40, // Minimum space between edges
    marginx: 40, // Canvas horizontal margin
    marginy: 40, // Canvas vertical margin
    acyclicer: 'greedy', // Prevents edge reversal artifacts in complex graphs
    ranker: 'tight-tree', // Produces the most compact, readable hierarchy
  });

  (nodes || []).forEach((node) => {
    // Because descriptions are moving to tooltips, nodes are shorter.
    // Fallback safe minimum height for Top-to-Bottom
    const nodeHeightConstrained = Math.max(80, nodeHeight);

    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeightConstrained });
  });

  (edges || []).forEach((edge) => {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  const newNodes = (nodes || []).map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = { ...node };

    // Shift anchor from Dagre center to React Flow top-left
    const nw = nodeWidth;
    const nh = nodeHeight;
    newNode.position = {
      x: nodeWithPosition?.x != null ? nodeWithPosition.x - nw / 2 : Math.random() * 400,
      y: nodeWithPosition?.y != null ? nodeWithPosition.y - nh / 2 : Math.random() * 400,
    };

    // TB layout: connections flow top → bottom
    newNode.targetPosition = direction === 'TB' ? Position.Top : Position.Left;
    newNode.sourcePosition = direction === 'TB' ? Position.Bottom : Position.Right;

    return newNode;
  });

  return { nodes: newNodes, edges: edges || [] };
};

// J. Servo Custom Glassmorphism Node
const JServoNode = ({ data }) => {
  const getStageStyles = (stage) => {
    switch (stage?.toLowerCase()) {
      case 'input':
        return {
          container:
            'border-[#20aacf] bg-[rgba(20,25,35,0.95)] shadow-[0_0_20px_rgba(32,170,207,0.25)]',
          iconWrap: 'bg-[rgba(32,170,207,0.15)] text-[#20aacf]',
        };
      case 'output':
        return {
          container:
            'border-[#10b981] bg-[rgba(20,25,35,0.95)] shadow-[0_0_20px_rgba(16,185,129,0.25)]',
          iconWrap: 'bg-[rgba(16,185,129,0.15)] text-[#10b981]',
        };
      case 'storage':
        return {
          container:
            'border-[#f59e0b] bg-[rgba(20,25,35,0.95)] shadow-[0_0_20px_rgba(245,158,11,0.25)]',
          iconWrap: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]',
        };
      case 'processing':
      default:
        return {
          container:
            'border-[rgba(128,65,153,0.8)] bg-[rgba(20,25,35,0.95)] shadow-[0_0_20px_rgba(128,65,153,0.3)]',
          iconWrap: 'bg-[rgba(128,65,153,0.15)] text-[#c084fc]',
        };
    }
  };

  const styles = getStageStyles(data.stage);

  return (
    <div className="node-tooltip-container">
      <div
        className={`relative min-w-[240px] h-[100px] px-6 rounded-xl border-2 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center justify-center gap-2 cursor-pointer ${
          data.isSimActive
            ? 'border-[#10b981] shadow-[0_0_30px_rgba(16,185,129,0.6)] scale-[1.04]'
            : styles.container
        }`}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-white border-2 border-transparent -mt-1"
        />

        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${styles.iconWrap}`}
        >
          {getIconForNode(data)}
        </div>

        <div
          style={{ fontFamily: "'Inter', 'Syne', sans-serif" }}
          className="flex-1 font-medium text-white text-[14px] tracking-tight leading-snug break-words hyphens-auto line-clamp-3 text-center"
        >
          {data.label}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (data.onGeneratePrompt) data.onGeneratePrompt(data);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-textMuted hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          title="Generate Implementation Prompt"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </button>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-white border-2 border-transparent -mb-1"
        />
      </div>

      {/* CSS Tooltip Content */}
      <div className="node-tooltip-content">
        <span className="tooltip-stage">{data.stage} Node Details</span>
        <div className="tooltip-desc">{data.description}</div>
      </div>
    </div>
  );
};

export default function FlowCanvas({ blueprint, n8nWorkflow, activeTab }) {
  const canvasRef = useRef(null);
  const nodeTypes = useMemo(() => ({ jservoNode: JServoNode, n8nNode: N8nNode }), []);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simActiveNodeId, setSimActiveNodeId] = useState(null);
  const simulationTimersRef = useRef([]);
  const { fitView } = useReactFlow();

  // Lifted Modal State
  const [activePromptNode, setActivePromptNode] = useState(null);
  const [promptContent, setPromptContent] = useState(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState(null);

  // ── Topological Simulation ───────────────────────────────────────────
  // Kahn's algorithm: returns node IDs in topological order from edges array.
  const buildTopologicalOrder = (nodeList, edgeList) => {
    const inDegree = {};
    const adj = {};
    nodeList.forEach((n) => {
      inDegree[n.id] = 0;
      adj[n.id] = [];
    });
    edgeList.forEach((e) => {
      if (adj[e.source] !== undefined) adj[e.source].push(e.target);
      if (inDegree[e.target] !== undefined) inDegree[e.target]++;
    });
    const queue = nodeList.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
    const order = [];
    while (queue.length > 0) {
      const curr = queue.shift();
      order.push(curr);
      (adj[curr] || []).forEach((next) => {
        inDegree[next]--;
        if (inDegree[next] === 0) queue.push(next);
      });
    }
    return order;
  };

  const stopSimulation = () => {
    simulationTimersRef.current.forEach(clearTimeout);
    simulationTimersRef.current = [];
    setIsSimulating(false);
    setSimActiveNodeId(null);
  };

  const startSimulation = () => {
    // Clean up any previous simulation
    simulationTimersRef.current.forEach(clearTimeout);
    simulationTimersRef.current = [];
    setIsSimulating(true);
    setSimActiveNodeId(null);

    const order = buildTopologicalOrder(nodes, edges);
    const STEP_MS = 700;

    order.forEach((nodeId, idx) => {
      const t = setTimeout(() => {
        setSimActiveNodeId(nodeId);
      }, idx * STEP_MS);
      simulationTimersRef.current.push(t);
    });

    // Auto-stop after the walk completes
    const totalMs = order.length * STEP_MS + 400;
    const stopTimer = setTimeout(() => stopSimulation(), totalMs);
    simulationTimersRef.current.push(stopTimer);
  };

  // Cleanup timers on unmount
  useEffect(() => () => simulationTimersRef.current.forEach(clearTimeout), []);

  const handleGeneratePrompt = async (nodeData) => {
    setActivePromptNode(nodeData);
    setPromptLoading(true);
    setPromptError(null);
    setPromptContent(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/developer-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodeData }),
      });

      if (!response.ok) throw new Error('Failed to generate prompt');
      const result = await response.json();
      setPromptContent(result.prompt);
    } catch (err) {
      setPromptError(err.message);
    } finally {
      setPromptLoading(false);
    }
  };

  useEffect(() => {
    if (blueprint?.nodes?.length > 0) {
      // Remap node types based on active tab
      const remappedNodes = blueprint.nodes.map((node) => ({
        ...node,
        type: activeTab === 'n8n' ? 'n8nNode' : 'jservoNode',
        data: {
          ...node.data,
          onGeneratePrompt: handleGeneratePrompt, // Inject the modal trigger callback into node data
        },
      }));

      // Convert edges with label truncation
      const processedEdges = (blueprint.edges || []).map((edge) => {
        let truncatedLabel = edge.label || '';
        if (truncatedLabel.length > 15) truncatedLabel = truncatedLabel.substring(0, 15) + '...';

        return {
          ...edge,
          label: truncatedLabel,
          labelStyle: {
            fill: 'rgba(255,255,255,0.9)',
            fontWeight: 700,
            fontSize: 12, // Increased from 10
            fontFamily: "'Syne', sans-serif",
          },
          labelBgStyle: {
            fill: 'rgba(20,25,35,0.85)',
            stroke: 'rgba(255,255,255,0.1)',
            strokeWidth: 1,
            rx: 6,
            ry: 6,
          },
          labelBgPadding: [6, 4],
        };
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        remappedNodes,
        processedEdges,
        'TB', // Direction: always TB now
        activeTab === 'n8n' ? 320 : 300, // Width: scaled for larger nodes
        activeTab === 'n8n' ? 140 : 130 // Height: scaled for larger nodes
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);

      // Allow React to commit the layout before fitting the view
      setTimeout(() => {
        fitView({
          padding: 0.15, // Reduced padding for tighter fit
          minZoom: 0.7, // Increased minZoom to keep text readable
          maxZoom: 1.2,
          duration: 800,
        });
      }, 200); // Increased defer for more reliable layout commit and zoom fitting
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [blueprint, activeTab, setNodes, setEdges, fitView]);

  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        const isCluster = edge.edgeType === 'cluster';
        return {
          ...edge,
          type: 'smoothstep',
          pathOptions: { borderRadius: 12 },
          animated: isSimulating,
          style: {
            stroke: isSimulating
              ? '#10b981'
              : isCluster
                ? '#a855f7'
                : activeTab === 'n8n'
                  ? 'rgba(255, 255, 255, 0.45)'
                  : 'rgba(255, 255, 255, 0.65)',
            strokeWidth: isSimulating ? 3 : 2,
            strokeDasharray: isCluster && !isSimulating ? '6 4' : undefined,
          },
        };
      })
    );
  }, [isSimulating, activeTab, setEdges]);

  // Propagate active simulation node ID into node data for visual ring effect
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, isSimActive: n.id === simActiveNodeId },
      }))
    );
  }, [simActiveNodeId, setNodes]);

  if (!blueprint || (!blueprint.nodes && !blueprint.edges)) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-textMuted glass-panel">
        Waiting for AI Architecture blueprint...
      </div>
    );
  }

  const handleExportJson = () => {
    if (!n8nWorkflow) return;
    const blob = new Blob([JSON.stringify(n8nWorkflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jservo_n8n_workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    toPng(canvasRef.current, { backgroundColor: '#0f1419', pixelRatio: 2 })
      .then((dataUrl) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'jservo_blueprint.png';
        a.click();
      })
      .catch((err) => console.error('[FlowCanvas] PNG export failed:', err));
  };

  return (
    <div className="w-full h-[700px] glass-panel p-2 relative flex flex-col">
      <div className="flex-1 w-full h-full relative" ref={canvasRef}>
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-3 items-end">
          {blueprint?.nodes?.length > 0 && (
            <button
              onClick={() => (isSimulating ? stopSimulation() : startSimulation())}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg backdrop-blur-md border ${
                isSimulating
                  ? 'bg-[rgba(16,185,129,0.2)] text-[#10b981] border-[#10b981]'
                  : 'bg-[rgba(255,255,255,0.05)] text-textSecondary border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)]'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isSimulating ? 'bg-[#10b981] animate-pulse' : 'bg-textMuted'
                }`}
              />
              <span>{isSimulating ? 'Stop Simulation' : 'Simulate Data Flow'}</span>
            </button>
          )}
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          className="bg-transparent"
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: {
              stroke: 'rgba(255, 255, 255, 0.6)',
              strokeWidth: 2,
            },
            animated: false,
            pathOptions: { borderRadius: 12 },
          }}
        >
          <Background color="#ffffff" gap={16} size={1} opacity={0.1} />
          <Controls className="!bg-[rgba(20,20,25,0.8)] !border-[rgba(255,255,255,0.1)] !fill-white" />
          <MiniMap
            nodeColor="#804199"
            maskColor="rgba(10, 10, 11, 0.7)"
            className="!bg-[rgba(20,20,25,0.8)] !border-[rgba(255,255,255,0.1)]"
          />
        </ReactFlow>
      </div>

      {activeTab === 'n8n' && (
        <div className="flex justify-end items-center gap-3 px-4 py-3 border-t border-[rgba(255,255,255,0.08)]">
          <button
            onClick={handleExportJson}
            disabled={!n8nWorkflow}
            title="Export n8n workflow as importable JSON"
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold tracking-wide
              border transition-all duration-200
              ${
                n8nWorkflow
                  ? 'bg-[rgba(6,182,212,0.1)] border-[rgba(6,182,212,0.4)] text-[#06b6d4] hover:-translate-y-0.5 hover:bg-[rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                  : 'opacity-40 cursor-not-allowed bg-transparent border-[rgba(255,255,255,0.1)] text-textMuted'
              }
            `}
          >
            <FileJson size={16} />
            <span>Export n8n JSON</span>
          </button>

          <button
            onClick={handleExportPng}
            disabled={!blueprint?.nodes?.length}
            title="Export canvas as PNG image"
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold tracking-wide
              border transition-all duration-200
              ${
                blueprint?.nodes?.length
                  ? 'bg-[rgba(168,85,247,0.1)] border-[rgba(168,85,247,0.4)] text-[#a855f7] hover:-translate-y-0.5 hover:bg-[rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                  : 'opacity-40 cursor-not-allowed bg-transparent border-[rgba(255,255,255,0.1)] text-textMuted'
              }
            `}
          >
            <ImageDown size={16} />
            <span>Export PNG</span>
          </button>
        </div>
      )}

      {/* Developer Prompt Modal */}
      {activePromptNode && (
        <div className="absolute inset-x-0 bottom-4 z-50 pointer-events-auto flex items-end justify-center">
          <div className="bg-[#111318] border border-[rgba(255,255,255,0.15)] rounded-lg p-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative w-11/12 max-w-2xl max-h-[400px] flex flex-col">
            <div className="flex justify-between flex-row items-center mb-4 shrink-0 border-b border-[rgba(255,255,255,0.1)] pb-2">
              <h4 className="text-secondary text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="text-textSecondary text-xs">Dev Prompt:</span>
                {activePromptNode.label}
              </h4>
              <button
                onClick={() => {
                  setActivePromptNode(null);
                  setPromptContent(null);
                }}
                className="text-textMuted hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[100px]">
              {promptLoading ? (
                <div className="flex items-center justify-center h-full text-sm text-textSecondary animate-pulse">
                  Consulting the Kinetic Framework...
                </div>
              ) : promptError ? (
                <div className="text-sm text-[#ef4444] text-center mt-4">{promptError}</div>
              ) : (
                <pre className="text-xs text-[#a1a1aa] whitespace-pre-wrap font-mono leading-relaxed bg-[#0a0a0c] p-4 rounded-md border border-[rgba(255,255,255,0.05)]">
                  {promptContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
