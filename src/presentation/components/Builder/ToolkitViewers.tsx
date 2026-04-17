// Presentation — read-only viewers for the AI-generated job toolkit.
// Siblings to Preview.tsx. Each viewer is a pure display + copy-to-clipboard
// widget for one toolkit artifact.

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Copy,
  Check,
  Mail,
  Linkedin,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  OutreachEmail,
  InterviewQuestion,
} from '../../../domain/entities/Resume';

// ─────────────────────────────────────────────────────────────
// Status card (missing / failed / regenerating)
// ─────────────────────────────────────────────────────────────

export type ToolkitItemStatus = 'success' | 'failed' | 'missing' | 'regenerating';

interface ToolkitStatusCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  status: Exclude<ToolkitItemStatus, 'success'>;
  errorMessage?: string;
  onRetry?: () => void;
}

export const ToolkitStatusCard: React.FC<ToolkitStatusCardProps> = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  status,
  errorMessage,
  onRetry,
}) => (
  <div className="w-full max-w-3xl mx-auto p-6 md:p-10">
    <div className="flex items-start gap-4 mb-8">
      <div className="w-11 h-11 rounded-xl bg-brand-700 text-charcoal-50 flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold mb-1">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-semibold text-brand-700 leading-tight mb-2">
          {title}
        </h2>
        <p className="text-sm text-brand-500 leading-relaxed">{description}</p>
      </div>
    </div>

    {status === 'regenerating' && (
      <div className="bg-charcoal-50 border border-charcoal-200 rounded-2xl p-8 flex flex-col items-center text-center">
        <Loader2 size={28} className="text-brand-700 animate-spin mb-4" />
        <p className="font-display text-lg font-semibold text-brand-700 mb-1">
          Regenerating…
        </p>
        <p className="text-sm text-brand-500">
          Usually done in under 15 seconds.
        </p>
      </div>
    )}

    {status === 'failed' && (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-base font-semibold text-red-900 mb-1">
              Generation failed
            </p>
            <p className="text-sm text-red-800 leading-relaxed">
              The AI couldn't produce this artifact on the last attempt. Retry usually fixes transient issues (rate limits, timeouts, network blips). If it keeps failing, check your Gemini API key and quota.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-100 border border-red-200 rounded-lg px-4 py-3 mb-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-red-900 font-semibold mb-1.5">
              Error details
            </p>
            <pre className="text-xs text-red-900 whitespace-pre-wrap font-mono leading-relaxed">
              {errorMessage}
            </pre>
          </div>
        )}

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-brand-700 text-charcoal-50 rounded-md px-4 py-2 hover:bg-brand-800 transition-colors"
          >
            <RefreshCw size={14} />
            Retry generation
          </button>
        )}
      </div>
    )}

    {status === 'missing' && (
      <div className="bg-charcoal-50 border border-charcoal-200 rounded-2xl p-6">
        <p className="text-sm text-brand-500 leading-relaxed mb-5">
          This hasn't been generated for this resume yet. Kick off generation now — it uses the same tailored job description and won't change the resume itself.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-brand-700 text-charcoal-50 rounded-md px-4 py-2 hover:bg-brand-800 transition-colors"
          >
            <Sparkles size={14} className="text-accent-400" />
            Generate now
          </button>
        )}
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
    return true;
  } catch (error) {
    console.error('Clipboard write failed:', error);
    toast.error('Could not copy. Select the text and copy manually.');
    return false;
  }
};

const CopyButton = ({
  text,
  label,
  variant = 'secondary',
}: {
  text: string;
  label: string;
  variant?: 'primary' | 'secondary';
}) => {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyToClipboard(text, label);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const base =
    'inline-flex items-center gap-1.5 text-sm font-semibold rounded-md px-3 py-1.5 transition-colors disabled:opacity-50';
  const styles =
    variant === 'primary'
      ? 'bg-brand-700 text-charcoal-50 hover:bg-brand-800'
      : 'bg-charcoal-50 text-brand-700 border border-charcoal-300 hover:border-brand-700';

  return (
    <button type="button" onClick={onCopy} className={`${base} ${styles}`}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
    </button>
  );
};

const ViewerShell = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="w-full max-w-3xl mx-auto p-6 md:p-10">
    <div className="flex items-start gap-4 mb-8">
      <div className="w-11 h-11 rounded-xl bg-brand-700 text-charcoal-50 flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold mb-1">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-semibold text-brand-700 leading-tight mb-2">
          {title}
        </h2>
        <p className="text-sm text-brand-500 leading-relaxed">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Outreach email
// ─────────────────────────────────────────────────────────────

export const OutreachEmailViewer = ({ email }: { email: OutreachEmail }) => {
  const fullText = `Subject: ${email.subject}\n\n${email.body}`;

  return (
    <ViewerShell
      icon={Mail}
      eyebrow="Outreach"
      title="Email the hiring manager"
      description="A short, specific cold email you can send directly to the person doing the hiring. Paste it into your client, add the recipient, and you're ready."
    >
      <div className="bg-charcoal-50 border border-charcoal-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-charcoal-200 bg-charcoal-100">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-brand-500 font-semibold mb-0.5">
              Subject
            </p>
            <p className="font-semibold text-brand-700 truncate">{email.subject}</p>
          </div>
          <CopyButton text={email.subject} label="Subject" />
        </div>

        <div className="px-5 py-5">
          <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-brand-700 mb-5">
            {email.body}
          </pre>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={email.body} label="Body" />
            <CopyButton text={fullText} label="Subject + body" variant="primary" />
          </div>
        </div>
      </div>

      <p className="text-xs text-brand-500 mt-4 leading-relaxed">
        Tip: find the hiring manager on LinkedIn, then confirm their work email with a tool like
        Hunter or RocketReach before sending.
      </p>
    </ViewerShell>
  );
};

// ─────────────────────────────────────────────────────────────
// LinkedIn connection note
// ─────────────────────────────────────────────────────────────

export const LinkedInMessageViewer = ({ message }: { message: string }) => {
  const charCount = message.length;
  const overLimit = charCount > 280;

  return (
    <ViewerShell
      icon={Linkedin}
      eyebrow="Outreach"
      title="LinkedIn connection note"
      description="A short, tailored note to send with your connection request. Stays within LinkedIn's 300-character limit and avoids template-y language recipients learn to ignore."
    >
      <div className="bg-charcoal-50 border border-charcoal-200 rounded-2xl p-5">
        <p className="font-sans text-[15px] leading-relaxed text-brand-700 mb-4">{message}</p>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-charcoal-200">
          <div className="text-xs flex items-center gap-2">
            <span className={overLimit ? 'text-red-600 font-semibold' : 'text-brand-500'}>
              {charCount} / 280 characters
            </span>
            {overLimit && (
              <span className="text-red-600">— trim before sending</span>
            )}
          </div>
          <CopyButton text={message} label="Note" variant="primary" />
        </div>
      </div>
    </ViewerShell>
  );
};

// ─────────────────────────────────────────────────────────────
// Interview prep
// ─────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  Behavioral: 'bg-accent-50 text-accent-700 border-accent-200',
  Technical: 'bg-brand-700 text-charcoal-50 border-brand-700',
  'Role-specific': 'bg-charcoal-100 text-brand-700 border-charcoal-300',
  'Values & Culture': 'bg-accent-100 text-accent-800 border-accent-200',
  Situational: 'bg-charcoal-200 text-brand-700 border-charcoal-300',
};

interface QuestionCardProps {
  q: InterviewQuestion;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  q,
  index,
  expanded,
  onToggle,
}) => {
  const badge = CATEGORY_STYLES[q.category] ?? CATEGORY_STYLES['Role-specific'];
  const fullText = `Q${index + 1}. ${q.question}\n\nWhy they ask: ${q.whyAsked}\n\nHow to answer: ${q.answerStrategy}`;

  return (
    <div className="bg-charcoal-50 border border-charcoal-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-charcoal-100 transition-colors"
      >
        <span className="font-display text-lg font-semibold text-accent-500 w-8 shrink-0 pt-0.5">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-base font-semibold text-brand-700 mb-2 leading-snug">
            {q.question}
          </p>
          <span
            className={`inline-block text-[10px] uppercase tracking-[0.14em] font-semibold px-2 py-0.5 rounded-full border ${badge}`}
          >
            {q.category}
          </span>
        </div>
        <span className="text-brand-500 shrink-0 pt-1">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pl-[4.25rem] space-y-4 text-sm leading-relaxed">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-brand-500 font-semibold mb-1.5">
              Why they ask
            </p>
            <p className="text-brand-700">{q.whyAsked}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-brand-500 font-semibold mb-1.5">
              How to answer
            </p>
            <p className="text-brand-700">{q.answerStrategy}</p>
          </div>
          <div className="pt-2">
            <CopyButton text={fullText} label="Question + notes" />
          </div>
        </div>
      )}
    </div>
  );
};

export const InterviewPrepViewer = ({
  questions,
}: {
  questions: InterviewQuestion[];
}) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const allExpanded = expanded.size === questions.length;
  const setAll = () => {
    setExpanded(
      allExpanded ? new Set() : new Set(questions.map((_, i) => i)),
    );
  };

  const fullBrief = questions
    .map(
      (q, i) =>
        `Q${i + 1}. ${q.question}\n[${q.category}]\nWhy they ask: ${q.whyAsked}\nHow to answer: ${q.answerStrategy}`,
    )
    .join('\n\n──\n\n');

  return (
    <ViewerShell
      icon={MessageSquare}
      eyebrow="Interview prep"
      title="Must-know interview questions"
      description="The questions you are most likely to be asked for this role, with what interviewers are scoring and how to structure a great answer using your actual experience."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-sm text-brand-500">
          {questions.length} questions tailored to your JD
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={setAll}
            className="text-sm font-semibold text-brand-700 hover:text-accent-600 px-2 py-1.5"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
          <CopyButton text={fullBrief} label="Prep brief" variant="primary" />
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            q={q}
            index={i}
            expanded={expanded.has(i)}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
    </ViewerShell>
  );
};
