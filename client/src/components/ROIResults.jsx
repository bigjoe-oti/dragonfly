import { Loader2, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { useState } from 'react';

export default function ROIResults({ roiData, tools }) {
  const [auditResult, setAuditResult] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState(null);

  if (!roiData) return null;

  const {
    adjustedSavings,
    totalImplementationCost,
    threeYearROI,
    paybackMonths,
    confidenceScore,
    agenticScore,
    savingsBreakdown,
    costBreakdown,
    riskFlags,
    strategicRecommendations,
    implementationTimeline,
    annualMaintenanceCost,
    yearOneRealization,
    yearTwoRealization,
    yearThreeRealization,
  } = roiData || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (score) => {
    if (score >= 70) return 'text-[#10b981] bg-[rgba(16,185,129,0.2)] border-[#10b981]';
    if (score >= 50) return 'text-[#f59e0b] bg-[rgba(245,158,11,0.2)] border-[#f59e0b]';
    return 'text-[#ef4444] bg-[rgba(239,68,68,0.2)] border-[#ef4444]';
  };

  const getAgenticColor = (score) => {
    if (score >= 70) return 'text-[#10b981] bg-[rgba(16,185,129,0.2)] border-[#10b981]';
    if (score >= 45) return 'text-[#f59e0b] bg-[rgba(245,158,11,0.2)] border-[#f59e0b]';
    return 'text-[#ef4444] bg-[rgba(239,68,68,0.2)] border-[#ef4444]';
  };

  const CostRow = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm">
      <span className="text-textSecondary">{label}</span>
      <span className="text-white font-medium">{value ? formatCurrency(value) : 'Included'}</span>
    </div>
  );

  const RealizationCard = ({ year, subtitle, value, percentage }) => (
    <div className="glass-panel !p-6 flex flex-col gap-3 relative overflow-hidden bg-[rgba(0,0,0,0.15)] border !border-[rgba(255,255,255,0.05)]">
      <div className="text-textSecondary font-bold tracking-[1px]">{year}</div>
      <div className="font-black text-white" style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)' }}>
        {formatCurrency(value)}
      </div>
      <div className="text-xs text-textMuted mb-2">{subtitle}</div>
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[rgba(255,255,255,0.05)]">
        <div className="h-full bg-[#20aacf]" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );

  const handleComplianceAudit = async () => {
    if (!tools || tools.length === 0) return;
    setIsAuditing(true);
    setAuditError(null);
    setAuditResult(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/compliance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tools }),
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setAuditResult(data);
    } catch (err) {
      setAuditError('Failed to run compliance audit. Please try again.');
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const renderAuditStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'green':
      case 'pass':
        return <ShieldCheck className="w-5 h-5 text-[#10b981] shrink-0" />;
      case 'yellow':
      case 'warning':
        return <ShieldAlert className="w-5 h-5 text-[#f59e0b] shrink-0" />;
      case 'red':
      case 'fail':
      default:
        return <ShieldX className="w-5 h-5 text-[#ef4444] shrink-0" />;
    }
  };

  return (
    <div className="glass-panel p-8 w-full flex flex-col gap-8">
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 border-b-2 border-[rgba(128,65,153,0.3)] pb-4 mb-6">
          <h2 className="text-2xl font-bold tracking-[1px] text-[#f1f5f9]">Impact Projection</h2>
          <div className="flex-1 flex items-center justify-end gap-4 flex-wrap">
            <button
              onClick={handleComplianceAudit}
              disabled={isAuditing || !tools?.length}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-wider uppercase font-bold border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Auditing...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Run Compliance Audit
                </>
              )}
            </button>
            <div className="flex flex-col items-center">
              <div
                className={`px-4 py-1.5 rounded-full text-xs tracking-wider uppercase font-bold border ${getConfidenceColor(confidenceScore)}`}
              >
                Confidence: {confidenceScore}%
              </div>
            </div>
            {agenticScore !== undefined && (
              <div className="flex flex-col items-center">
                <div
                  className={`px-4 py-1.5 rounded-full text-xs tracking-wider uppercase font-bold border ${getAgenticColor(agenticScore)}`}
                >
                  Agentic Readiness: {agenticScore}
                </div>
                <div className="text-[10px] text-textMuted mt-1">
                  Autonomous AI Deployment Potential
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel !p-5 !rounded-lg border !border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] shadow-[0_4px_16px_0_rgba(31,38,135,0.1)]">
            <div className="text-sm text-textSecondary tracking-[1px] font-medium mb-2">
              Projected Annual Savings
            </div>
            <div
              className="text-white mb-1 tracking-tight truncate font-bold"
              style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
              title={formatCurrency(adjustedSavings)}
            >
              {formatCurrency(adjustedSavings)}
            </div>
            <div className="text-xs text-textMuted">Year 2-3 steady state</div>
          </div>

          <div className="glass-panel !p-5 !rounded-lg border !border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] shadow-[0_4px_16px_0_rgba(31,38,135,0.1)]">
            <div className="text-sm text-textSecondary tracking-[1px] font-medium mb-2">
              Implementation Investment
            </div>
            <div
              className="text-white mb-1 tracking-tight truncate font-bold"
              style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
              title={formatCurrency(totalImplementationCost)}
            >
              {formatCurrency(totalImplementationCost)}
            </div>
            <div className="text-xs text-textMuted">Total 18-month cost</div>
          </div>

          <div className="glass-panel !p-5 !rounded-lg border !border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] shadow-[0_4px_16px_0_rgba(31,38,135,0.1)]">
            <div className="text-sm text-textSecondary tracking-[1px] font-medium mb-2">
              Net ROI (3-Year)
            </div>
            <div
              className="text-white mb-1 tracking-tight truncate font-bold"
              style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
            >
              {Math.round(threeYearROI)}%
            </div>
            <div className="text-xs text-textMuted">Based on implementation success</div>
          </div>

          <div className="glass-panel !p-5 !rounded-lg border !border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] shadow-[0_4px_16px_0_rgba(31,38,135,0.1)]">
            <div className="text-sm text-textSecondary tracking-[1px] font-medium mb-2">
              Payback Period
            </div>
            <div
              className="text-white mb-1 tracking-tight truncate font-bold"
              style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
            >
              {paybackMonths ? `${paybackMonths} months` : '> 72 months'}
            </div>
            <div className="text-xs text-textMuted">Break-even timeline</div>
          </div>
        </div>

        {/* ─── NEW ENRICHED SECTIONS ─── */}

        {savingsBreakdown && (
          <div className="mt-12">
            <h3 className="text-xl font-bold tracking-[1px] text-white mb-6">
              Value Breakdown — Three-Pillar Model
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel !p-6 !rounded-lg border !border-[rgba(32,170,207,0.3)] bg-[rgba(32,170,207,0.05)] shadow-[0_4px_16px_0_rgba(32,170,207,0.1)] flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#20aacf]" />
                <div className="text-textSecondary text-sm tracking-[1px] font-medium uppercase">
                  Process & Labor Optimization
                </div>
                <div
                  className="font-bold text-white truncate"
                  style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)' }}
                >
                  {formatCurrency(savingsBreakdown.operationalEfficiency)}
                </div>
              </div>
              <div className="glass-panel !p-6 !rounded-lg border !border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] shadow-[0_4px_16px_0_rgba(16,185,129,0.1)] flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#10b981]" />
                <div className="text-textSecondary text-sm tracking-[1px] font-medium uppercase">
                  AI-Enabled Growth Contribution
                </div>
                <div
                  className="font-bold text-white truncate"
                  style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)' }}
                >
                  {formatCurrency(savingsBreakdown.revenueGeneration)}
                </div>
              </div>
              <div className="glass-panel !p-6 !rounded-lg border !border-[rgba(168,85,247,0.3)] bg-[rgba(168,85,247,0.05)] shadow-[0_4px_16px_0_rgba(168,85,247,0.1)] flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#a855f7]" />
                <div className="text-textSecondary text-sm tracking-[1px] font-medium uppercase">
                  Compliance & Error Reduction
                </div>
                <div
                  className="font-bold text-white truncate"
                  style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)' }}
                >
                  {formatCurrency(savingsBreakdown.riskMitigation)}
                </div>
              </div>
            </div>
          </div>
        )}

        {costBreakdown && (
          <div className="mt-12">
            <h3 className="text-xl font-bold tracking-[1px] text-white mb-6">
              Implementation Cost Breakdown
            </h3>
            <div className="glass-panel p-6 max-w-2xl mx-auto flex flex-col gap-4 bg-[rgba(0,0,0,0.2)]">
              <CostRow label="Base Development" value={costBreakdown.baseDevelopment} />
              <CostRow label="Complexity Premium" value={costBreakdown.complexityPremium} />
              <CostRow label="Tech Infrastructure" value={costBreakdown.techInfrastructure} />
              <CostRow label="Change Management" value={costBreakdown.changeManagement} />
              <CostRow label="Data Preparation" value={costBreakdown.dataPreparation} />
              <div className="h-px w-full bg-[rgba(255,255,255,0.1)] my-2" />
              <div className="flex justify-between items-center">
                <span className="text-textSecondary font-bold text-lg">Total Implementation</span>
                <span className="text-white font-black text-2xl">
                  {formatCurrency(totalImplementationCost)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-textSecondary">Annual Maintenance</span>
                <span className="text-textMuted">
                  {annualMaintenanceCost
                    ? `${formatCurrency(annualMaintenanceCost)}/yr`
                    : 'Included'}
                </span>
              </div>
            </div>
          </div>
        )}

        {yearOneRealization !== undefined && (
          <div className="mt-12">
            <h3 className="text-xl font-bold tracking-[1px] text-white mb-6">
              3-Year Savings Realization Curve
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RealizationCard
                year="Year 1"
                subtitle="20% realization — Ramp & Adoption Phase"
                value={yearOneRealization}
                percentage={20}
              />
              <RealizationCard
                year="Year 2"
                subtitle="60% realization — Stabilization Phase"
                value={yearTwoRealization}
                percentage={60}
              />
              <RealizationCard
                year="Year 3"
                subtitle="90% realization — Optimization Phase"
                value={yearThreeRealization}
                percentage={90}
              />
            </div>
          </div>
        )}

        {riskFlags?.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold tracking-[1px] text-[#ef4444] mb-6 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6" /> Advisory Risk Flags
            </h3>
            <div className="flex flex-col gap-4">
              {riskFlags.map((flag, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-l-4 flex gap-3 ${flag.level === 'high' ? 'border-l-[#ef4444] bg-[rgba(239,68,68,0.08)]' : 'border-l-[#f59e0b] bg-[rgba(245,158,11,0.08)]'}`}
                >
                  <div className="text-xl mt-0.5">{flag.level === 'high' ? '⚠️' : '⚡'}</div>
                  <div className="text-sm text-textSecondary leading-relaxed">{flag.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {strategicRecommendations?.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold tracking-[1px] text-white mb-6">
              Strategic Recommendations
            </h3>
            <div className="glass-panel p-6 flex flex-col gap-5 bg-[rgba(0,0,0,0.2)]">
              {strategicRecommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#20aacf] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-textSecondary leading-relaxed flex-1">{rec}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {implementationTimeline?.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold tracking-[1px] text-white mb-6">
              Implementation Roadmap
            </h3>
            <div className="glass-panel p-6 bg-[rgba(0,0,0,0.2)] relative">
              <div className="absolute top-8 bottom-8 left-9 w-0.5 bg-[rgba(255,255,255,0.1)]" />
              <div className="flex flex-col gap-6">
                {implementationTimeline.map((phase, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 items-center relative z-10 hover:bg-[rgba(255,255,255,0.02)] p-2 rounded-lg transition-colors"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#20aacf] shrink-0 outline outline-4 outline-[rgba(32,170,207,0.2)]" />
                    <div className="text-white font-medium">{phase}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {auditError && (
        <div className="p-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] text-sm">
          {auditError}
        </div>
      )}

      {auditResult && auditResult.complianceChecks && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 border-t-2 border-[rgba(32,170,207,0.3)] pt-6 mt-2">
          <h3 className="text-xl font-bold tracking-[1px] text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#20aacf]" /> Enterprise Compliance Audit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {auditResult.complianceChecks.map((check, idx) => (
              <div
                key={idx}
                className="glass-panel !p-4 !rounded-lg border !border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] flex flex-col gap-2"
              >
                <div className="flex items-start gap-3 justify-between">
                  <h4 className="font-bold text-white text-sm tracking-wide">{check.domain}</h4>
                  {renderAuditStatusIcon(check.status)}
                </div>
                <p className="text-xs text-textSecondary leading-relaxed flex-1">
                  {check.assessment}
                </p>
                {check.remediation && check.status !== 'green' && (
                  <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)] text-[11px] text-[#f59e0b] font-medium">
                    <span className="opacity-70 uppercase tracking-widest text-[9px] block mb-1">
                      Remediation
                    </span>
                    {check.remediation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
