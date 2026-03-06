import {
  AlertTriangle,
  ArrowRightCircle,
  BarChart2,
  Bot,
  Cpu,
  Database,
  FileText,
  GitMerge,
  Globe,
  HelpCircle,
  Lock,
  Network,
  Send,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { Handle, Position } from 'reactflow';

// Complete category configuration — exhaustive, no unmapped categories
const CATEGORY_CONFIG = {
  trigger: {
    accent: '#f97316', // Orange
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.4)',
    Icon: Zap,
  },
  agent: {
    accent: '#a855f7', // Purple
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.4)',
    Icon: Bot,
  },
  tool: {
    accent: '#3b82f6', // Blue
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.4)',
    Icon: Wrench,
  },
  memory: {
    accent: '#14b8a6', // Teal
    bg: 'rgba(20,184,166,0.12)',
    border: 'rgba(20,184,166,0.4)',
    Icon: Database,
  },
  action: {
    accent: '#22c55e', // Green
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.4)',
    Icon: Send,
  },
  core: {
    accent: '#94a3b8', // Slate Grey
    bg: 'rgba(148,163,184,0.10)',
    border: 'rgba(148,163,184,0.3)',
    Icon: GitMerge,
  },
  output: {
    accent: '#06b6d4', // Cyan
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.4)',
    Icon: ArrowRightCircle,
  },
  error: {
    accent: '#ef4444', // Red
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.4)',
    Icon: AlertTriangle,
  },
  // Fallback for any unmapped category Dragonfly returns
  default: {
    accent: '#94a3b8',
    bg: 'rgba(148,163,184,0.10)',
    border: 'rgba(148,163,184,0.25)',
    Icon: HelpCircle,
  },
};

const ICON_OVERRIDE_MAP = {
  Zap,
  Bot,
  Wrench,
  Database,
  Send,
  GitMerge,
  ArrowRightCircle,
  AlertTriangle,
  HelpCircle,
  // Extended set matching orchestrator prompt's approved icon list
  BarChart2,
  Cpu,
  FileText,
  Globe,
  Lock,
  Network,
  Users,
};

export default function N8nNode({ data }) {
  const config = CATEGORY_CONFIG[data?.category] || CATEGORY_CONFIG.default;
  const IconComponent =
    data?.icon && ICON_OVERRIDE_MAP[data.icon] ? ICON_OVERRIDE_MAP[data.icon] : config.Icon;

  return (
    <div className="node-tooltip-container">
      <div
        style={{
          background: '#1a1a1a',
          border: `1px solid ${config.border}`,
          borderRadius: '12px',
          minWidth: '250px',
          maxWidth: '300px',
          boxShadow: `0 0 16px ${config.bg}, 0 4px 24px rgba(0,0,0,0.4)`,
          fontFamily: "'Syne', sans-serif",
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: config.accent, border: 'none', width: 10, height: 10, top: -5 }}
        />

        {/* Header accent strip with icon */}
        <div
          style={{
            background: config.bg,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: `rgba(${hexToRgb(config.accent)},0.15)`,
              border: `1px solid ${config.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconComponent size={16} color={config.accent} strokeWidth={2} />
          </div>
          <div style={{ width: '100%' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: config.accent,
                lineHeight: 1,
                marginBottom: '4px',
                opacity: 0.8,
              }}
            >
              {data?.category || 'node'}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#ffffff',
                lineHeight: 1.3,
                wordBreak: 'break-word',
                hyphens: 'auto',
              }}
            >
              {data?.label}
            </div>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: config.accent,
            border: 'none',
            width: 10,
            height: 10,
            bottom: -5,
          }}
        />
      </div>

      {/* CSS Tooltip Content */}
      <div className="node-tooltip-content">
        <span className="tooltip-stage">{data.category} Details</span>
        <div className="tooltip-desc">{data.description}</div>
      </div>
    </div>
  );
}

// Utility — convert hex color to r,g,b string for rgba usage
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '148,163,184';
}
