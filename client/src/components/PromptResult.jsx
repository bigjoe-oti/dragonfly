import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function PromptResult({ content }) {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-[1px] text-white font-syne">
          Engineered System Prompt
        </h2>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-[rgba(32,170,207,0.1)] hover:bg-[rgba(32,170,207,0.2)] border border-[rgba(32,170,207,0.3)] rounded-lg text-[#20aacf] font-bold text-sm transition-all"
        >
          {copied ? '✓ Copied' : 'Copy Prompt'}
        </button>
      </div>
      <div
        className="prose prose-invert max-w-none text-textSecondary leading-relaxed text-sm
        [&_h1]:text-white [&_h1]:font-syne [&_h1]:font-bold [&_h1]:tracking-[1px] [&_h1]:text-2xl [&_h1]:mb-4 [&_h1]:mt-6
        [&_h2]:text-white [&_h2]:font-syne [&_h2]:font-bold [&_h2]:tracking-[1px] [&_h2]:text-lg [&_h2]:mb-3 [&_h2]:mt-5
        [&_h3]:text-[#20aacf] [&_h3]:font-syne [&_h3]:font-bold [&_h3]:text-base [&_h3]:mb-2 [&_h3]:mt-4
        [&_p]:text-textSecondary [&_p]:leading-relaxed [&_p]:mb-3
        [&_ul]:text-textSecondary [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:list-disc
        [&_ol]:text-textSecondary [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal
        [&_li]:mb-1.5
        [&_code]:bg-[rgba(255,255,255,0.08)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#20aacf] [&_code]:font-mono [&_code]:text-xs
        [&_pre]:bg-[rgba(255,255,255,0.05)] [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[#20aacf] [&_pre_code]:font-mono [&_pre_code]:text-xs
        [&_hr]:border-[rgba(255,255,255,0.1)] [&_hr]:my-6
        [&_strong]:text-white [&_strong]:font-bold
        [&_blockquote]:border-l-2 [&_blockquote]:border-[#20aacf] [&_blockquote]:pl-4 [&_blockquote]:text-textMuted [&_blockquote]:italic"
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
