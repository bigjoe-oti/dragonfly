import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import BlueprintHealthScore from './components/BlueprintHealthScore';
import FlowCanvas from './components/FlowCanvas';
import Intake from './components/Intake';
import PromptResult from './components/PromptResult';
import ROIResults from './components/ROIResults';
import { useAIArchitect } from './hooks/useAIArchitect';

function App() {
  const [activeTab, setActiveTab] = useState('blueprint');
  const [tabInputs, setTabInputs] = useState({ blueprint: '', n8n: '', prompt: '' });
  const { isLoading, loadingPhase, data, error, generateArchitecture } = useAIArchitect();
  const [shareToast, setShareToast] = useState(null); // 'copied' | 'error' | null
  const didHydrate = useRef(false);

  // ── Shareable URL: decode hash on initial load ─────────────────────────
  useEffect(() => {
    if (didHydrate.current) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    try {
      const json = JSON.parse(atob(decodeURIComponent(hash)));
      // Validate minimal structure before trusting the hash payload
      if (json && (json.roi || json.architecture || json.promptOutput)) {
        // We need to inject the decoded data into the hook — use the private injector
        // exposed via a synthetic event (simplest pattern without hook refactor)
        window.__jservoHydrateData?.(json);
      }
    } catch {
      // Malformed hash — ignore silently
    }
    didHydrate.current = true;
  }, []);

  // ── Shareable URL: encode current result into URL hash ─────────────────
  const handleShareUrl = useCallback(() => {
    if (!data) return;
    try {
      const encoded = encodeURIComponent(btoa(JSON.stringify(data)));
      const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
      navigator.clipboard.writeText(url).then(() => {
        setShareToast('copied');
        setTimeout(() => setShareToast(null), 2500);
      });
      // Also update the browser URL bar without a page reload
      window.history.replaceState(null, '', `#${encoded}`);
    } catch {
      setShareToast('error');
      setTimeout(() => setShareToast(null), 2500);
    }
  }, [data]);

  // Clear URL hash when data is empty for all tabs
  useEffect(() => {
    const hasAnyData = Object.values(data).some((v) => v !== null);
    if (!hasAnyData && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [data]);

  return (
    <div className="w-full flex flex-col gap-10 mt-8 mb-24">
      {/* Header Section */}
      <header className="text-center px-4 max-w-4xl mx-auto mb-4">
        <h1 className="text-[30px] md:text-[40px] font-[710] tracking-[1px] text-white mb-4">
          Dragonfly AI Stack Architect
        </h1>
        <div className="text-textSecondary tracking-[1px] text-sm font-medium max-w-3xl mx-auto space-y-3 text-left inline-block">
          <p className="text-justify text-white/90">
            Architect, validate, and deploy your AI ecosystem in seconds. The Dragonfly engine
            translates your unique business challenges into an executable transformation roadmap:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2 text-white/70 mx-auto table">
            <li>
              <strong className="text-white">Strategic Validation:</strong> Dynamic ROI forecasting
              and enterprise-grade compliance auditing.
            </li>
            <li>
              <strong className="text-white">Visual Architecture:</strong> Interactive data flow
              blueprints mapping your optimal AI tech stack.
            </li>
            <li>
              <strong className="text-white">Zero-Day Deployment:</strong> Downloadable n8n
              workflows and custom developer prompts ready for immediate execution.
            </li>
          </ul>
        </div>
      </header>

      {/* Intake Form */}
      <section className="px-4">
        <Intake
          onGenerate={(input) => generateArchitecture(input, activeTab)}
          inputValue={tabInputs[activeTab]}
          setInputValue={(val) => setTabInputs((prev) => ({ ...prev, [activeTab]: val }))}
          isLoading={isLoading}
          loadingPhase={loadingPhase}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </section>

      {/* Error Message */}
      {error && (
        <div className="px-4 max-w-2xl mx-auto w-full">
          <div className="glass-panel border-[#ef4444]/30 bg-[#ef4444]/10 p-4 rounded-xl text-center">
            <p className="text-[#ef4444] font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {data[activeTab] && (
        <div className="flex flex-col gap-10 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Strategy Overview */}
          {activeTab === 'blueprint' && data.blueprint?.architecture?.strategy && (
            <section className="max-w-4xl mx-auto w-full glass-panel p-8 border-[rgba(255,255,255,0.15)] bg-[rgba(128,65,153,0.05)]">
              <h2 className="text-2xl font-bold tracking-[1px] text-white mb-4">
                Architectural Strategy
              </h2>
              <p className="text-textSecondary leading-relaxed text-lg">
                {data.blueprint.architecture.strategy}
              </p>
            </section>
          )}

          {/* Blueprint Health Score */}
          {activeTab === 'blueprint' && data.blueprint?.architecture?.blueprint && (
            <section className="max-w-4xl mx-auto w-full">
              <BlueprintHealthScore
                blueprint={data.blueprint.architecture.blueprint}
                tools={data.blueprint.architecture?.tools}
                n8nValidation={data.blueprint.architecture?.n8nValidation ?? null}
                activeTab={activeTab}
              />
            </section>
          )}

          {/* ROI Dashboard */}
          {activeTab === 'blueprint' && data.blueprint?.roi && (
            <section className="max-w-6xl mx-auto w-full">
              <ROIResults roiData={data.blueprint.roi} tools={data.blueprint.architecture?.tools} />
            </section>
          )}

          {/* React Flow Blueprint */}
          {(activeTab === 'blueprint' || activeTab === 'n8n') && (
            <section className="max-w-6xl mx-auto w-full">
              <h2 className="text-2xl font-bold tracking-[1px] text-white mb-6 text-center">
                Automation Blueprint
              </h2>
              <ReactFlowProvider>
                <FlowCanvas
                  blueprint={
                    data[activeTab === 'n8n' ? 'n8n' : 'blueprint']?.architecture?.blueprint
                  }
                  n8nWorkflow={
                    data[activeTab === 'n8n' ? 'n8n' : 'blueprint']?.architecture?.n8nWorkflow
                  }
                  activeTab={activeTab}
                />
              </ReactFlowProvider>
            </section>
          )}

          {/* Tool Integrations */}
          {activeTab === 'blueprint' &&
            data.blueprint?.architecture?.tools &&
            data.blueprint.architecture.tools.length > 0 && (
              <section className="max-w-6xl mx-auto w-full">
                <h2 className="text-2xl font-bold tracking-[1px] text-white mb-6 text-center">
                  Recommended AI Stack
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.blueprint.architecture.tools.map((tool, idx) => (
                    <div
                      key={idx}
                      className="glass-panel p-6 hover:-translate-y-1 transition-transform border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)]"
                    >
                      <div className="flex items-start gap-4 mb-5">
                        {tool.icon && (
                          <div className="w-[46px] h-[46px] min-w-[46px] rounded-full flex items-center justify-center bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] shrink-0 shadow-sm">
                            <span className="material-icons-outlined text-secondary text-[24px] select-none leading-none">
                              {tool.icon.trim()}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col gap-2.5 min-w-0 pt-0.5">
                          <h3 className="text-[1.15rem] font-bold tracking-[1px] text-white leading-tight break-words">
                            {tool.name}
                          </h3>
                          <div className="flex">
                            <span className="inline-flex items-center justify-center px-3 py-1.5 leading-none rounded-full text-[10px] font-bold tracking-[1.5px] uppercase bg-[rgba(32,170,207,0.15)] text-[#20aacf] border border-[rgba(32,170,207,0.25)] shrink-0 whitespace-nowrap">
                              {tool.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-textSecondary leading-[1.65] text-justify block">
                        {tool.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Engineered Prompt Output */}
          {activeTab === 'prompt' && data.prompt?.promptOutput && (
            <section className="max-w-4xl mx-auto w-full">
              <PromptResult content={data.prompt.promptOutput} />
            </section>
          )}

          {/* Share Blueprint Button */}
          <div className="max-w-4xl mx-auto w-full flex justify-center pt-4 pb-2">
            <div className="relative">
              <button
                onClick={handleShareUrl}
                title="Copy a shareable link to this blueprint"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-textSecondary hover:text-white hover:border-[rgba(32,170,207,0.4)] hover:bg-[rgba(32,170,207,0.08)] transition-all duration-200"
              >
                <span>🔗</span>
                <span>Copy Shareable Link</span>
              </button>
              {shareToast && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-lg bg-[rgba(20,25,35,0.95)] border border-[rgba(255,255,255,0.1)] text-white">
                  {shareToast === 'copied'
                    ? '✓ Link copied to clipboard'
                    : '✕ Copy failed — try manually'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
