import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import blueprintIcon from '../assets/blueprint-button-icon.png';
import dragonflyLogo from '../assets/dragonfly.png';
import engineerPromptIcon from '../assets/engineer-prompt-icon.png';
import workflowIcon from '../assets/workflow-button-icon.png';
export default function Intake({
  onGenerate,
  inputValue,
  setInputValue,
  isLoading,
  loadingPhase,
  activeTab,
  onTabChange,
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e, mode = 'blueprint') => {
    e.preventDefault();
    console.log('[Intake] Submitting form...', { mode, problemDescription: inputValue });
    if (!inputValue.trim() || isLoading) {
      console.log('[Intake] Submission blocked:', {
        isEmpty: !inputValue.trim(),
        isLoading,
      });
      return;
    }

    onGenerate(inputValue, mode);
  };

  return (
    <div className="glass-panel p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-[84px] h-[84px] rounded-full bg-transparent border-2 border-[rgba(255,255,255,0.15)] flex items-center justify-center overflow-hidden shrink-0 shadow-[0_8px_16px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)]">
          <img
            src={dragonflyLogo}
            alt="Dragonfly"
            className="w-[115%] h-[115%] object-cover scale-110"
          />
        </div>
        <div>
          <h2 className="text-[25px] font-[700] tracking-[1px] text-white mb-1">
            Dragonfly AI Stack Architect
          </h2>
        </div>
      </div>

      <form className="flex flex-col gap-4">
        {/* Input Area Group */}
        <div className="flex flex-col">
          {/* Tab Navigation */}
          <div className="flex relative z-[20] -mb-[1px]">
            {['blueprint', 'n8n', 'prompt'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`px-6 py-3 text-sm tracking-[1px] font-syne transition-all duration-300 border border-b-0 rounded-t-xl relative ${
                  activeTab === tab
                    ? `z-[25] text-white font-semibold pb-[13px] border-b-0 border-b-transparent ${
                        isFocused
                          ? 'border-t-[rgba(32,170,207,0.5)] border-x-[rgba(32,170,207,0.5)] bg-[rgba(255,255,255,0.06)]'
                          : 'border-t-[rgba(255,255,255,0.15)] border-x-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)]'
                      } after:content-[''] after:absolute after:-bottom-[1px] after:left-[0px] after:right-[0px] after:h-[2px] after:bg-[#0f1419] after:-z-10`
                    : 'z-10 text-textMuted border-transparent hover:bg-[rgba(255,255,255,0.05)] hover:text-white font-medium overflow-hidden'
                }`}
                style={{
                  backdropFilter: activeTab === tab ? 'blur(10px)' : 'none',
                }}
              >
                {tab === 'blueprint'
                  ? 'Blueprint'
                  : tab === 'n8n'
                    ? 'n8n Workflow'
                    : 'Prompt Engineer'}
              </button>
            ))}
          </div>

          <div className="relative z-10">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e, activeTab);
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                activeTab === 'blueprint'
                  ? 'Describe your business problem. Include your industry, company size, annual revenue, and the process you want to automate...'
                  : activeTab === 'n8n'
                    ? 'Describe the workflow you want to automate. Include triggers, data sources, transformations, and destination systems...'
                    : 'Describe the AI agent or assistant you want to build. What is its role, constraints, tone, and expected output format?'
              }
              className={`glass-input custom-placeholder min-h-[160px] resize-y font-[450] tracking-[0.7px] relative w-full`}
              style={{
                borderTopLeftRadius: activeTab === 'blueprint' ? '0' : '0.75rem',
                borderTopRightRadius: '0.75rem',
                borderBottomLeftRadius: '0.75rem',
                borderBottomRightRadius: '0.75rem',
              }}
              disabled={isLoading}
              required
            />
          </div>

          {/* Revenue / Budget Notice — Blueprint tab only */}
          {activeTab === 'blueprint' && (
            <div
              role="note"
              aria-live="polite"
              className="flex items-start gap-3 mt-2 px-4 py-3 rounded-xl border-l-4 border-[#f59e0b] bg-[rgba(245,158,11,0.07)]"
            >
              <AlertCircle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-[rgba(245,158,11,0.9)] leading-relaxed">
                <strong className="font-bold">Required for ROI calculation:</strong> Include your
                approximate annual revenue or project budget in the description above (e.g.{' '}
                <em>&ldquo;We are a $5M/year retail company...&rdquo;</em>). Without it, the
                Blueprint engine cannot generate financial projections.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#20aacf] pt-4">
          <div className="text-xs text-textSecondary flex flex-col items-start gap-1.5 font-medium">
            <div>
              Powered by <span className="font-bold text-[#804199]">Dragonfly</span> Precision{' '}
              <span className="font-bold text-[#20aacf]">Protocol</span> & Kinetic Mode.{' '}
              <span className="text-white tracking-[1px]">Your AI Partner in Business</span>
            </div>
            <a
              href="https://jservo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-textMuted/80 hover:text-white transition-colors underline decoration-[rgba(255,255,255,0.2)] underline-offset-2"
            >
              Designed By J. Servo LLC
            </a>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, activeTab)}
              disabled={isLoading || !inputValue.trim()}
              className="btn-primary font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Dragonfly Is Engineering...</span>
                </>
              ) : (
                <>
                  <span>
                    {activeTab === 'blueprint'
                      ? 'Generate Blueprint'
                      : activeTab === 'n8n'
                        ? 'Generate Workflow'
                        : 'Engineer Prompt'}
                  </span>
                  <img
                    src={
                      activeTab === 'n8n'
                        ? workflowIcon
                        : activeTab === 'prompt'
                          ? engineerPromptIcon
                          : blueprintIcon
                    }
                    alt="Button Icon"
                    className="w-[19px] h-[19px] ml-1 object-contain"
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {isLoading && (
        <div className="mt-8 p-4 rounded-xl bg-[rgba(32,170,207,0.1)] border border-[rgba(32,170,207,0.2)] flex items-start gap-3">
          <div className="mt-1 shrink-0">
            <Loader2 className="w-5 h-5 text-secondary animate-spin" />
          </div>
          <div>
            <h4 className="font-bold text-secondary text-sm">
              {activeTab === 'blueprint' &&
                loadingPhase === 'parsing' &&
                'Phase 1 — Parsing your business context with Dragonfly...'}
              {activeTab === 'blueprint' &&
                loadingPhase === 'rendering' &&
                'Phase 2 — Dragonfly is architecting your blueprint...'}
              {activeTab === 'n8n' && 'Dragonfly is designing your n8n automation workflow...'}
              {activeTab === 'prompt' && 'Dragonfly is engineering your expert prompt...'}
            </h4>
            <p className="text-xs text-textSecondary mt-1 leading-relaxed">
              {activeTab === 'blueprint'
                ? 'Analyzing industry vectors, structuring automation flow, and computing financial projections. This may take up to 90 seconds.'
                : activeTab === 'n8n'
                  ? 'Designing agentic cluster nodes, connection schema, and error handling branches. May take up to 60 seconds.'
                  : 'Crafting your system prompt with structured sections, tone guidance, and output format. Usually ready in under 30 seconds.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
