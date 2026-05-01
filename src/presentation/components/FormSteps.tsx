// Presentation Layer - Form Components
//
// Shared across ProfileSetupScreen and BuilderScreen. Each step is a pure
// controlled component: parent owns the data, the step renders the UI.
//
// Design idioms (matches AGENTS.md §10):
//   - Editorial Ink + Saffron, never blue/purple/gradients.
//   - SectionHeader with a Saffron eyebrow + Fraunces display title.
//   - TipCard — always-on "Quick guide" panel above the form (rules + real
//     examples). User can hide it; defaults open.
//   - PromptList — numbered scaffolding above brain-dump textareas: 3 small
//     questions that walk the user through what to type.
//   - WritingChecklist — live, transparent feedback under brain-dump
//     textareas. Four explicit checks (action verb, number, outcome, detail)
//     that flip from hollow to filled as the user types. Replaces the old
//     opaque 3-bar QualityMeter.
//   - PolishHint — small "type messy, the AI will polish" reassurance next
//     to brain-dump fields.
//   - CollapsibleItem — list cards (Experience, Projects, Education, etc.)
//     auto-collapse to a one-line summary once the key fields are filled,
//     expand again on click.

import React, { useMemo, useState } from 'react';
import { extractSkillsFromJD, buildSkillPool } from '../utils/skillMatcher';
import {
  PersonalInfo,
  WorkExperience,
  Education,
  TargetJob,
  UserType,
  Project,
  Extracurricular,
  Award,
  Certification,
  Affiliation,
  Publication,
  Language,
  LanguageProficiency,
  Reference,
} from '../../domain/entities/Resume';
import {
  Plus,
  X,
  Trash2,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award as AwardIcon,
  BookOpen,
  Users,
  Lightbulb,
  ChevronDown,
  Check,
  Sparkles,
  Info,
  Link as LinkIcon,
  Building2,
  Languages as LanguagesIcon,
  UserCheck,
} from 'lucide-react';
import { MonthPicker } from './ui/month-picker';

// -----------------------------------------------------------------------------
// Shared primitives
// -----------------------------------------------------------------------------

const SectionHeader = ({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) => (
  <div className="mb-7">
    <p className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold mb-2">
      {eyebrow}
    </p>
    <h2 className="font-display text-3xl sm:text-[2rem] font-semibold text-brand-700 leading-[1.1]">
      {title}
    </h2>
    <p className="text-sm sm:text-[15px] text-brand-500 mt-2.5 leading-relaxed max-w-2xl">
      {desc}
    </p>
  </div>
);

// Inputs across a row stay vertically aligned even when only some fields have
// helper or error text — both render BELOW the input, never between label and
// input, so the input baseline is determined by the (consistent) label only.
const InputGroup = ({
  label,
  error,
  helper,
  optional,
  required,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  helper?: string;
  optional?: boolean;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <div className="flex items-baseline justify-between gap-2">
      <label className="text-sm font-semibold text-brand-700">
        {label}
        {required && <span className="text-accent-500 ml-0.5">*</span>}
      </label>
      {optional && (
        <span className="text-[10px] uppercase tracking-[0.18em] text-charcoal-400 font-semibold">
          Optional
        </span>
      )}
    </div>
    {children}
    {error ? (
      <span className="text-xs text-red-600 font-medium">{error}</span>
    ) : helper ? (
      <p className="text-xs text-charcoal-500 leading-relaxed">{helper}</p>
    ) : null}
  </div>
);

type InputProps = React.ComponentProps<'input'> & { error?: string };

const Input = ({ error, className, ...props }: InputProps) => (
  <input
    {...props}
    aria-invalid={!!error}
    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white text-brand-800 placeholder:text-charcoal-400 focus:outline-none focus-visible:ring-2 transition-colors disabled:bg-charcoal-100 disabled:text-charcoal-400 ${
      error
        ? 'border-red-400 focus-visible:ring-red-400'
        : 'border-charcoal-300 hover:border-charcoal-400 focus-visible:ring-accent-400 focus-visible:border-accent-400'
    } ${className || ''}`}
  />
);

type TextAreaProps = React.ComponentProps<'textarea'> & { error?: string };

const TextArea = ({ error, className, ...props }: TextAreaProps) => (
  <textarea
    {...props}
    aria-invalid={!!error}
    className={`w-full rounded-lg border px-3.5 py-3 text-sm bg-white text-brand-800 placeholder:text-charcoal-400 focus:outline-none focus-visible:ring-2 transition-colors leading-relaxed ${
      error
        ? 'border-red-400 focus-visible:ring-red-400'
        : 'border-charcoal-300 hover:border-charcoal-400 focus-visible:ring-accent-400 focus-visible:border-accent-400'
    } ${className || ''}`}
  />
);

// Persistent guide panel. Defaults to OPEN — the whole point of this app is
// to coach the user as they fill the form, not hide guidance behind a click.
// User can still collapse it ("Hide") if they want to focus on typing.
const TipCard = ({
  eyebrow = 'Quick guide',
  title = 'How to write a strong entry',
  rules,
  examples,
  exampleLabel = 'Real examples',
  defaultOpen = true,
}: {
  eyebrow?: string;
  title?: string;
  rules: string[];
  examples: string[];
  exampleLabel?: string;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-accent-200 bg-accent-50/70 overflow-hidden">
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        <div className="w-8 h-8 rounded-full bg-accent-400 text-brand-800 flex items-center justify-center shrink-0">
          <Lightbulb size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-accent-700 font-semibold">
            {eyebrow}
          </p>
          <p className="text-[15px] font-semibold text-brand-700 leading-snug mt-0.5">
            {title}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label={open ? 'Hide guide' : 'Show guide'}
          className="text-[11px] uppercase tracking-[0.18em] text-accent-700 font-semibold inline-flex items-center gap-1 hover:text-accent-800 transition-colors shrink-0 mt-1"
        >
          {open ? 'Hide' : 'Show'}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      {open && (
        <div className="px-5 pb-5 space-y-4">
          <ul className="space-y-2">
            {rules.map(r => (
              <li
                key={r}
                className="flex gap-2.5 text-[13.5px] leading-relaxed text-brand-700"
              >
                <Check
                  size={15}
                  className="text-accent-600 shrink-0 mt-0.5"
                  strokeWidth={2.5}
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          {examples.length > 0 && (
            <div className="rounded-xl bg-white/70 border border-accent-100 p-3.5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-accent-700 font-semibold mb-2">
                {exampleLabel}
              </p>
              <ul className="space-y-2">
                {examples.map(e => (
                  <li
                    key={e}
                    className="text-[13px] leading-relaxed text-brand-600 pl-3 border-l-2 border-accent-300 italic"
                  >
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Heuristic signals for the free-form "brain dump" textareas. Pure regex —
// no network call. Drives WritingChecklist below so the user can see exactly
// what they have and what's still missing.
const ACTION_VERB_RE =
  /\b(led|ran|built|designed|launched|grew|managed|shipped|drove|created|improved|reduced|increased|organized|delivered|owned|scaled|developed|implemented|coached|mentored|taught|researched|analyzed|wrote|negotiated|won|closed|sold|recruited|hired|trained|advised|architected|deployed|automated|published|presented|founded|coordinated|streamlined|optimized|produced|planned|facilitated|launched|drafted|authored|spearheaded|oversaw|supervised|curated|redesigned|rebuilt|migrated|rolled\s+out)\b/i;
const METRIC_RE =
  /(\$\s?\d)|(\b\d+(\.\d+)?\s?(%|x|k|m|million|thousand|hrs?|hours?|mins?|days?|weeks?|months?|years?|yrs?|people|users|customers|clients|students|patients|cases|tickets|leads|orders|reps|members|sessions|events)\b)/i;
const OUTCOME_RE =
  /\b(resulted in|leading to|so that|because of|cut|saved|raised|earned|grew|reduced|increased|improved|drove|won|closed|hit|exceeded|beat|raised by|fell|rose)\b/i;

type WritingCheck = {
  id: string;
  label: string;
  hint: string;
  passed: boolean;
};

function getWritingChecks(text: string): WritingCheck[] {
  const t = text.trim();
  const words = t.length === 0 ? 0 : t.split(/\s+/).length;
  const hasVerb = ACTION_VERB_RE.test(t);
  const hasMetric = METRIC_RE.test(t);
  const hasOutcome = hasMetric || OUTCOME_RE.test(t);
  return [
    {
      id: 'verb',
      label: 'Lead with an action verb',
      hint: 'led, built, grew, shipped, designed, taught, drove…',
      passed: hasVerb,
    },
    {
      id: 'metric',
      label: 'Include a real number',
      hint: '%, $, users, headcount, hours, audience size, grade',
      passed: hasMetric,
    },
    {
      id: 'outcome',
      label: 'Say what changed because of you',
      hint: 'the result — fewer tickets, more revenue, faster turnaround',
      passed: hasOutcome,
    },
    {
      id: 'detail',
      label: 'Give 2–3 sentences of detail',
      hint: 'enough so the AI has something real to shape into bullets',
      passed: words >= 18,
    },
  ];
}

// Numbered scaffolding above brain-dump textareas — turns "what do I write?"
// into 3 small questions the user can answer one at a time.
const PromptList = ({ prompts }: { prompts: string[] }) => (
  <ol className="rounded-xl border border-charcoal-200 bg-charcoal-50/70 px-4 py-3 space-y-1.5">
    {prompts.map((p, i) => (
      <li
        key={i}
        className="flex items-start gap-2.5 text-[13px] leading-relaxed text-brand-700"
      >
        <span className="w-5 h-5 shrink-0 rounded-full bg-white border border-charcoal-200 text-[11px] font-semibold text-accent-600 flex items-center justify-center mt-px">
          {i + 1}
        </span>
        <span>{p}</span>
      </li>
    ))}
  </ol>
);

// Live, transparent feedback under brain-dump textareas. Replaces the old
// 3-bar opaque meter with explicit checks the user can read at a glance.
const WritingChecklist = ({ text }: { text: string }) => {
  const items = getWritingChecks(text);
  const passed = items.filter(i => i.passed).length;
  const empty = !text.trim();
  const allPass = passed === items.length;

  return (
    <div className="rounded-xl border border-charcoal-200 bg-white p-3.5 mt-1.5">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-charcoal-500 font-semibold">
          {empty
            ? 'We\'ll check 4 things as you type'
            : allPass
              ? 'Looking great'
              : `${passed} of ${items.length} so far`}
        </p>
        {allPass && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-700">
            <Sparkles size={12} />
            Plenty for the AI to work with
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {items.map(item => (
          <li
            key={item.id}
            className="flex items-start gap-2.5 text-[13px] leading-snug"
          >
            <span
              aria-hidden
              className={`mt-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                item.passed
                  ? 'bg-accent-500 text-white'
                  : 'border border-charcoal-300 bg-white'
              }`}
            >
              {item.passed && <Check size={11} strokeWidth={3} />}
            </span>
            <span className="flex-1 min-w-0">
              <span
                className={`font-semibold ${
                  item.passed ? 'text-brand-700' : 'text-charcoal-700'
                }`}
              >
                {item.label}
              </span>
              <span className="text-charcoal-500"> — {item.hint}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Friendlier alternative to TipCard for brain-dump-heavy steps (Experience,
// Projects). Leads with a *reassurance hero* — "write it however feels
// natural, the AI cleans it up" — instead of a wall of rules. Examples are
// tucked behind a toggle so they're available without being in your face.
// The "what to mention" scaffolding lives inline next to each textarea via
// PromptList, so it isn't duplicated up here.
const WritingGuide = ({
  reassurance,
  examples,
}: {
  reassurance: string;
  examples: string[];
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-accent-200 bg-accent-50/70 overflow-hidden">
      <div className="flex items-start gap-3.5 px-5 py-5">
        <div className="w-10 h-10 rounded-full bg-accent-400 text-brand-800 flex items-center justify-center shrink-0">
          <Sparkles size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-accent-700 font-semibold mb-1.5">
            You're safe to brain-dump
          </p>
          <p className="text-[15px] leading-relaxed text-brand-700">
            {reassurance}
          </p>
        </div>
      </div>
      {examples.length > 0 && (
        <div className="border-t border-accent-200/70">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            className="w-full flex items-center justify-between gap-2 px-5 py-3 text-left hover:bg-white/40 transition-colors"
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-accent-700 font-semibold">
              {open
                ? 'Hide examples'
                : `Want a peek? ${examples.length} real examples`}
            </span>
            <ChevronDown
              size={14}
              className={`text-accent-700 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
            />
          </button>
          {open && (
            <div className="px-5 pb-4">
              <ul className="space-y-2">
                {examples.map(e => (
                  <li
                    key={e}
                    className="text-[13px] leading-relaxed text-brand-600 pl-3 border-l-2 border-accent-300 italic"
                  >
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Single-paragraph saffron callout for steps that don't need a full TipCard
// or WritingGuide — a friendly one-liner that orients the user without a rule
// wall. Used in Awards, Certifications, Affiliations, Publications.
const MiniGuide = ({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border border-accent-200 bg-accent-50/70 px-5 py-4">
    <div className="w-8 h-8 rounded-full bg-accent-400 text-brand-800 flex items-center justify-center shrink-0">
      {icon ?? <Lightbulb size={14} />}
    </div>
    <p className="text-[13.5px] leading-relaxed text-brand-700 flex-1 pt-1">
      {children}
    </p>
  </div>
);

// Calm reassurance shown next to brain-dump fields so users brain-dump freely.
const PolishHint = () => (
  <p className="flex items-start gap-1.5 text-[12px] text-charcoal-500 leading-relaxed">
    <Sparkles size={12} className="text-accent-500 shrink-0 mt-0.5" />
    <span>
      Type messy. The AI rewrites this into clean resume bullets after you
      submit — your job is just to give it the raw facts.
    </span>
  </p>
);

// List-item card that auto-collapses to a one-line summary once its key fields
// are filled. Prevents long forms from becoming an endless scroll.
const CollapsibleItem = ({
  icon,
  indexLabel,
  isFilled,
  summaryPrimary,
  summarySecondary,
  onRemove,
  children,
}: {
  icon: React.ReactNode;
  indexLabel: string;
  isFilled: boolean;
  summaryPrimary?: string;
  summarySecondary?: string;
  onRemove: () => void;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(!isFilled);
  return (
    <div className="rounded-2xl border border-charcoal-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-charcoal-100">
        <div className="w-9 h-9 rounded-full bg-charcoal-100 text-brand-700 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex-1 text-left min-w-0"
          aria-expanded={open}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal-500 font-semibold">
            {indexLabel}
          </p>
          {isFilled && !open && summaryPrimary ? (
            <p className="text-sm text-brand-700 truncate mt-0.5">
              <span className="font-semibold">{summaryPrimary}</span>
              {summarySecondary && (
                <span className="text-charcoal-500 font-normal">
                  {' '}· {summarySecondary}
                </span>
              )}
            </p>
          ) : (
            <p className="text-[13px] text-charcoal-500 mt-0.5">
              {open ? 'Editing details' : 'Tap to fill in the details'}
            </p>
          )}
        </button>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="text-charcoal-400 hover:text-brand-700 p-1.5 rounded-md hover:bg-charcoal-100 transition-colors"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <ChevronDown
            size={18}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-charcoal-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
          aria-label="Remove"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {open && <div className="p-5 space-y-5">{children}</div>}
    </div>
  );
};

const AddButton = ({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full py-3.5 border-2 border-dashed border-charcoal-300 rounded-2xl text-charcoal-600 hover:border-accent-400 hover:text-accent-700 hover:bg-accent-50/40 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
  >
    <Plus size={18} /> {label}
  </button>
);

const formatMonth = (ym?: string) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const idx = Number(m) - 1;
  const names = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return Number.isFinite(idx) && idx >= 0 && idx < 12 ? `${names[idx]} ${y}` : ym;
};

const dateRange = (start?: string, end?: string, isCurrent?: boolean) => {
  const s = formatMonth(start);
  const e = isCurrent ? 'Present' : formatMonth(end);
  if (!s && !e) return '';
  if (!s) return e;
  if (!e) return s;
  return `${s} – ${e}`;
};

// -----------------------------------------------------------------------------
// Steps
// -----------------------------------------------------------------------------

export const UserTypeStep: React.FC<{
  userType?: UserType;
  update: (userType: UserType) => void;
}> = ({ userType, update }) => {
  const options: {
    key: UserType;
    title: string;
    icon: React.ReactNode;
    lead: string;
    fits: string[];
  }[] = [
    {
      key: 'experienced',
      title: 'Experienced Professional',
      icon: <Briefcase size={22} />,
      lead: "You've held at least one job — full-time, internship, long contract, freelance — that you want on your resume.",
      fits: [
        'Any industry — nursing, teaching, law, design, sales, engineering, trades',
        "Career changers — we'll still lead with your work history",
        'Returning after a break — experience still goes first',
      ],
    },
    {
      key: 'student',
      title: 'Student / Entry Level',
      icon: <GraduationCap size={22} />,
      lead: "You're in school or recently graduated and don't have full-time work yet. We'll lead with your projects, coursework, and activities.",
      fits: [
        'Undergrad, grad student, or recent graduate',
        'Bootcamp, trade, or certificate programs',
        'First job or first internship — projects and activities do the work',
      ],
    },
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Step 1 · About you"
        title="Which path fits you best?"
        desc="This one choice shapes the rest of the form — which sections we show you, what examples we use, and how the AI frames your story. You can change it later."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map(opt => {
          const active = userType === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => update(opt.key)}
              className={`text-left p-6 rounded-2xl border-2 transition-all ${
                active
                  ? 'border-accent-400 bg-accent-50/50 shadow-sm'
                  : 'border-charcoal-200 bg-white hover:border-charcoal-400'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                    active
                      ? 'bg-brand-700 text-accent-300'
                      : 'bg-charcoal-100 text-brand-700'
                  }`}
                >
                  {opt.icon}
                </div>
                <h3 className="font-display text-xl font-semibold text-brand-700">
                  {opt.title}
                </h3>
              </div>
              <p className="text-sm text-brand-600 leading-relaxed mb-4">
                {opt.lead}
              </p>
              <ul className="space-y-1.5">
                {opt.fits.map(f => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[13px] text-charcoal-600"
                  >
                    <Check
                      size={14}
                      className="text-accent-500 shrink-0 mt-[3px]"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-charcoal-100 border border-charcoal-200 px-4 py-3 text-[13px] text-brand-600">
        <Info size={15} className="text-brand-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-semibold text-brand-700">Not sure?</span> If you have
          even one paid role on your resume already, pick Experienced Professional. If
          your strongest material is coursework, clubs, or capstone projects, pick
          Student / Entry Level.
        </p>
      </div>
    </div>
  );
};

export const TargetJobStep: React.FC<{
  data: TargetJob;
  errors?: Record<string, string>;
  update: (d: TargetJob) => void;
}> = ({ data, errors, update }) => (
  <div>
    <SectionHeader
      eyebrow="Target role"
      title="What job are you applying for?"
      desc="Paste the actual job posting. The more context we have, the more precisely your resume, cover letter, outreach email, and interview prep can be tailored."
    />

    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputGroup
          label="Job Title"
          required
          helper="Exactly as it appears in the posting."
          error={errors?.['targetJob.title']}
        >
          <Input
            placeholder="e.g. Senior Marketing Manager"
            value={data.title}
            error={errors?.['targetJob.title']}
            onChange={e => update({ ...data, title: e.target.value })}
          />
        </InputGroup>
        <InputGroup
          label="Company / Organization"
          required
          helper="Used in cover letter salutation and outreach email."
          error={errors?.['targetJob.company']}
        >
          <Input
            placeholder="e.g. Acme Inc., Mayo Clinic, Pearson"
            value={data.company}
            error={errors?.['targetJob.company']}
            onChange={e => update({ ...data, company: e.target.value })}
          />
        </InputGroup>
      </div>

      <InputGroup
        label="Full Job Description"
        required
        helper="Paste everything — responsibilities, qualifications, and 'about the team'. More text = sharper tailoring."
        error={errors?.['targetJob.description']}
      >
        <TextArea
          rows={10}
          placeholder={`Copy the full posting from the careers page or LinkedIn. Include:
• The "Responsibilities" or "What you'll do" section
• The "Qualifications" or "What we're looking for" section
• Any team or mission blurb — it helps with the cover letter`}
          value={data.description}
          error={errors?.['targetJob.description']}
          onChange={e => update({ ...data, description: e.target.value })}
        />
      </InputGroup>

      <TipCard
        title="Why the full JD matters"
        rules={[
          'The AI matches your experience to specific phrases in the posting — keywords, tools, and responsibilities.',
          'A longer JD lets us rank which of your skills and bullets to lead with.',
          "The cover letter pulls on the 'about us' or team paragraph, so leave it in.",
        ]}
        examples={[]}
      />
    </div>
  </div>
);

// Small section header used inside PersonalInfoStep cards.
const PanelHeader = ({
  eyebrow,
  title,
  hint,
  optional,
  icon,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  optional?: boolean;
  icon?: React.ReactNode;
}) => (
  <div className="mb-5">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-accent-600">{icon}</span>}
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold">
          {eyebrow}
        </p>
      </div>
      {optional && (
        <span className="text-[10px] uppercase tracking-[0.18em] text-charcoal-400 font-semibold">
          All optional
        </span>
      )}
    </div>
    <p className="font-display text-lg font-semibold text-brand-700 mt-1.5">
      {title}
    </p>
    {hint && (
      <p className="text-[13px] text-charcoal-500 mt-1 leading-relaxed">
        {hint}
      </p>
    )}
  </div>
);

export const PersonalInfoStep: React.FC<{
  data: PersonalInfo;
  errors?: Record<string, string>;
  update: (d: PersonalInfo) => void;
}> = ({ data, errors, update }) => (
  <div>
    <SectionHeader
      eyebrow="Contact"
      title="How can recruiters reach you?"
      desc="Just the essentials at the top of a resume. Two required fields — name and email. Everything else is optional, add what you have."
    />

    <div className="space-y-5">
      {/* The basics — required */}
      <section className="rounded-2xl border border-charcoal-200 bg-white p-5 sm:p-6">
        <PanelHeader
          eyebrow="The basics"
          title="Name and email"
          hint="These two go on every resume. Name as you'd want it printed."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup
            label="Full name"
            required
            error={errors?.['personalInfo.fullName']}
          >
            <Input
              error={errors?.['personalInfo.fullName']}
              value={data.fullName}
              onChange={e => update({ ...data, fullName: e.target.value })}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </InputGroup>
          <InputGroup
            label="Email"
            required
            error={errors?.['personalInfo.email']}
          >
            <Input
              error={errors?.['personalInfo.email']}
              type="email"
              value={data.email}
              onChange={e => update({ ...data, email: e.target.value })}
              placeholder="jane@example.com"
              autoComplete="email"
            />
          </InputGroup>
        </div>
      </section>

      {/* Phone & location — optional */}
      <section className="rounded-2xl border border-charcoal-200 bg-white p-5 sm:p-6">
        <PanelHeader
          eyebrow="Phone & location"
          title="Where you're based"
          hint="Optional, but most recruiters expect to see them."
          optional
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Phone">
            <Input
              type="tel"
              value={data.phone}
              onChange={e => update({ ...data, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
            />
          </InputGroup>
          <InputGroup
            label="Location"
            helper="City + state or country is plenty. No street address."
          >
            <Input
              value={data.location}
              onChange={e => update({ ...data, location: e.target.value })}
              placeholder="San Francisco, CA"
            />
          </InputGroup>
        </div>
      </section>

      {/* Links — optional */}
      <section className="rounded-2xl border border-charcoal-200 bg-white p-5 sm:p-6">
        <PanelHeader
          eyebrow="Links"
          title="Where to send them next"
          hint="Add only the links that back up your work — two polished beats five half-built."
          optional
          icon={<LinkIcon size={14} />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="LinkedIn">
            <Input
              type="url"
              value={data.linkedin || ''}
              onChange={e => update({ ...data, linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/janedoe"
            />
          </InputGroup>
          <InputGroup label="GitHub / Code portfolio">
            <Input
              type="url"
              value={data.github || ''}
              onChange={e => update({ ...data, github: e.target.value })}
              placeholder="https://github.com/janedoe"
            />
          </InputGroup>
          <InputGroup
            label="Website / Portfolio"
            className="md:col-span-2"
            helper="Personal site, Behance, Dribbble, Medium, published article, case study — anything the reader can click."
          >
            <Input
              type="url"
              value={data.website || ''}
              onChange={e => update({ ...data, website: e.target.value })}
              placeholder="https://janedoe.com"
            />
          </InputGroup>
        </div>
      </section>
    </div>
  </div>
);

export const ProjectsStep: React.FC<{
  data: Project[];
  errors?: Record<string, string>;
  update: (d: Project[]) => void;
  userType?: UserType;
}> = ({ data, errors, update, userType }) => {
  const addProject = () => {
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        name: '',
        rawDescription: '',
        refinedBullets: [],
        technologies: '',
      },
    ]);
  };

  const removeProject = (id: string) => update(data.filter(p => p.id !== id));

  const updateProject = (id: string, field: keyof Project, value: string) => {
    update(data.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const studentExamples = [
    'Built a study-group matching app for my cohort; 120+ students signed up in the first month.',
    'Ran a 6-week community tutoring program for 24 middle-schoolers; average reading scores rose 18%.',
    'Designed a capstone brand campaign for a local café; presentation voted best in cohort.',
  ];
  const proExamples = [
    'Led a 6-month brand relaunch across web, packaging, and social; engagement grew 40%.',
    'Shipped a customer dashboard with React + Node.js in 8 weeks; support tickets fell 30%.',
    'Ran a 20-patient community health study; findings published in the department review.',
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Your work"
        title="Projects"
        desc={
          userType === 'student'
            ? "Capstones, coursework, clubs, freelance, side projects — anything you planned, built, or delivered. These carry your resume when you don't have full-time experience yet."
            : 'Side projects, freelance work, research studies, campaigns, case studies, open-source contributions — anything you planned, built, or delivered outside of a job title.'
        }
      />

      <WritingGuide
        reassurance="Tell us about each project in your own words — no formatting, no special structure. The AI turns it into clean resume bullets after you submit. The questions next to the textarea are just a nudge if you draw a blank; you don't have to follow them."
        examples={userType === 'student' ? studentExamples : proExamples}
      />

      {data.map((project, index) => {
        const filled = !!project.name.trim() && !!project.rawDescription.trim();
        return (
          <CollapsibleItem
            key={project.id}
            icon={<FolderGit2 size={16} />}
            indexLabel={`Project ${index + 1}`}
            isFilled={filled}
            summaryPrimary={project.name || 'Untitled project'}
            summarySecondary={project.technologies}
            onRemove={() => removeProject(project.id)}
          >
            <InputGroup
              label="Project name"
              required
              error={errors?.[`projects.${index}.name`]}
            >
              <Input
                error={errors?.[`projects.${index}.name`]}
                value={project.name}
                onChange={e =>
                  updateProject(project.id, 'name', e.target.value)
                }
                placeholder="e.g. Brand Relaunch Campaign, Community Health Study, E-commerce Platform"
              />
            </InputGroup>

            <InputGroup
              label="Tools, methods, or technologies"
              optional
              helper="Comma-separated. Leave blank if it doesn't apply (research, legal cases, curriculum, art)."
            >
              <Input
                value={project.technologies || ''}
                onChange={e =>
                  updateProject(project.id, 'technologies', e.target.value)
                }
                placeholder="e.g. Figma, Adobe Suite · SPSS, qualitative interviews · React, Node.js"
              />
            </InputGroup>

            <InputGroup
              label="Link"
              optional
              helper="Portfolio page, GitHub repo, published article, case study — anything the reader can click."
            >
              <Input
                type="url"
                value={project.link || ''}
                onChange={e =>
                  updateProject(project.id, 'link', e.target.value)
                }
                placeholder="https://…"
              />
            </InputGroup>

            <InputGroup
              label="Tell us about this project"
              required
              error={errors?.[`projects.${index}.rawDescription`]}
            >
              <PromptList
                prompts={[
                  'What were you trying to do, and for whom?',
                  'What did you build, design, study, or deliver?',
                  'What was the result — users, audience, money, time saved, grade?',
                ]}
              />
              <PolishHint />
              <TextArea
                error={errors?.[`projects.${index}.rawDescription`]}
                rows={5}
                value={project.rawDescription}
                onChange={e =>
                  updateProject(project.id, 'rawDescription', e.target.value)
                }
                placeholder="e.g. Built a study-group matching app for our cohort. Designed the matching logic in Python, the UI in React. Within a month 120+ students had signed up and we matched 85% of them within 24 hours."
              />
              <WritingChecklist text={project.rawDescription} />
            </InputGroup>
          </CollapsibleItem>
        );
      })}

      <AddButton onClick={addProject} label="Add project" />
    </div>
  );
};

export const ExperienceStep: React.FC<{
  data: WorkExperience[];
  errors?: Record<string, string>;
  update: (d: WorkExperience[]) => void;
}> = ({ data, errors, update }) => {
  const addExp = () => {
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        rawDescription: '',
        refinedBullets: [],
      },
    ]);
  };

  const removeExp = (id: string) => update(data.filter(exp => exp.id !== id));
  const updateExp = (id: string, field: keyof WorkExperience, value: unknown) => {
    update(data.map(exp => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Your work"
        title="Experience"
        desc="Paid roles — full-time, part-time, contract, freelance, internships. Start with the most recent. The AI will rewrite each entry into tight, achievement-focused bullets."
      />

      <WritingGuide
        reassurance="Write each role however feels natural — even one run-on paragraph works. The AI rewrites this into clean, polished resume bullets after you submit. The questions next to each textarea are just a nudge if you draw a blank; you don't have to follow them."
        examples={[
          'Led a 5-person team through a checkout rebuild; cart-abandon rate fell 28% in one quarter.',
          'Managed 20+ patient caseload across 3 units; reduced 30-day readmissions 15%.',
          'Closed $1.2M in new business in Q3; grew territory pipeline 35% YoY.',
          'Drafted and argued 30+ motions in civil cases; average turnaround cut in half.',
        ]}
      />

      {data.map((exp, index) => {
        const filled =
          !!exp.company.trim() && !!exp.role.trim() && !!exp.startDate;
        return (
          <CollapsibleItem
            key={exp.id}
            icon={<Briefcase size={16} />}
            indexLabel={`Position ${index + 1}`}
            isFilled={filled}
            summaryPrimary={
              exp.role && exp.company
                ? `${exp.role} · ${exp.company}`
                : exp.role || exp.company || 'Untitled role'
            }
            summarySecondary={dateRange(exp.startDate, exp.endDate, exp.isCurrent)}
            onRemove={() => removeExp(exp.id)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup
                label="Job title"
                required
                error={errors?.[`experience.${index}.role`]}
              >
                <Input
                  error={errors?.[`experience.${index}.role`]}
                  value={exp.role}
                  onChange={e => updateExp(exp.id, 'role', e.target.value)}
                  placeholder="e.g. Registered Nurse, Marketing Manager, Software Engineer"
                />
              </InputGroup>
              <InputGroup
                label="Company / Organization"
                required
                error={errors?.[`experience.${index}.company`]}
              >
                <Input
                  error={errors?.[`experience.${index}.company`]}
                  value={exp.company}
                  onChange={e => updateExp(exp.id, 'company', e.target.value)}
                  placeholder="e.g. Mayo Clinic, Acme Corp, Oakwood High School"
                />
              </InputGroup>

              <InputGroup
                label="Start date"
                required
                error={errors?.[`experience.${index}.startDate`]}
              >
                <MonthPicker
                  isError={!!errors?.[`experience.${index}.startDate`]}
                  value={exp.startDate}
                  onChange={val => updateExp(exp.id, 'startDate', val)}
                />
              </InputGroup>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-semibold text-brand-700">
                    End date
                    {!exp.isCurrent && (
                      <span className="text-accent-500 ml-0.5">*</span>
                    )}
                  </label>
                </div>
                {exp.isCurrent ? (
                  <div className="w-full rounded-lg border border-charcoal-200 bg-charcoal-100 px-3.5 py-2.5 text-sm text-brand-600 font-medium">
                    Present
                  </div>
                ) : (
                  <>
                    <MonthPicker
                      isError={!!errors?.[`experience.${index}.endDate`]}
                      value={exp.endDate}
                      onChange={val => updateExp(exp.id, 'endDate', val)}
                    />
                    {errors?.[`experience.${index}.endDate`] && (
                      <span className="text-xs text-red-600 font-medium">
                        {errors[`experience.${index}.endDate`]}
                      </span>
                    )}
                  </>
                )}

                <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-accent-500 rounded border-charcoal-300"
                    checked={exp.isCurrent}
                    onChange={e => {
                      const isCurrent = e.target.checked;
                      update(
                        data.map(item =>
                          item.id === exp.id
                            ? {
                                ...item,
                                isCurrent,
                                endDate: isCurrent ? '' : item.endDate,
                              }
                            : item,
                        ),
                      );
                    }}
                  />
                  <span
                    className={`text-sm font-medium ${
                      exp.isCurrent ? 'text-accent-700' : 'text-charcoal-600'
                    }`}
                  >
                    I currently work here
                  </span>
                </label>
              </div>
            </div>

            <InputGroup
              label="Tell us what you did here"
              required
              error={errors?.[`experience.${index}.rawDescription`]}
            >
              <PromptList
                prompts={[
                  'What did you own day-to-day — your scope, team, customers?',
                  'What did you actually build, ship, lead, fix, or improve?',
                  'What changed because of you? Add a number if you have one ($, %, users, hours).',
                ]}
              />
              <PolishHint />
              <TextArea
                error={errors?.[`experience.${index}.rawDescription`]}
                rows={6}
                value={exp.rawDescription}
                onChange={e =>
                  updateExp(exp.id, 'rawDescription', e.target.value)
                }
                placeholder="e.g. I led a 5-person team rebuilding our checkout flow over Q2. We shipped a one-page checkout that cut cart abandonment from 38% to 27% — about $1.4M in recovered revenue that year."
              />
              <WritingChecklist text={exp.rawDescription} />
            </InputGroup>
          </CollapsibleItem>
        );
      })}

      <AddButton onClick={addExp} label="Add position" />
    </div>
  );
};

export const EducationStep: React.FC<{
  data: Education[];
  errors?: Record<string, string>;
  update: (d: Education[]) => void;
}> = ({ data, errors, update }) => {
  const addEdu = () =>
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        school: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
      },
    ]);

  const removeEdu = (id: string) => update(data.filter(e => e.id !== id));
  const updateEdu = (id: string, field: keyof Education, value: string) => {
    update(data.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Credentials"
        title="Education"
        desc="Most recent first. Include the full degree name — recruiters search on it."
      />

      <TipCard
        title="What to include"
        rules={[
          'Full degree name as it appears on your diploma — "Bachelor of Science", not "BS".',
          'Only list GPA if it helps you: 3.5+ for college, 3.7+ for grad school.',
          'High school is fine if you\'re a student or recent grad — drop it once you have a degree.',
        ]}
        examples={[
          'BSN, Nursing — University of Michigan, 2018–2022',
          'MBA, Marketing — NYU Stern, 2020–2022, GPA 3.8/4.0',
          'High School Diploma — Oakwood High School, 2019–2023',
        ]}
      />

      {data.map((edu, index) => {
        const filled =
          !!edu.school.trim() && !!edu.degree.trim() && !!edu.field.trim();
        return (
          <CollapsibleItem
            key={edu.id}
            icon={<GraduationCap size={16} />}
            indexLabel={`School ${index + 1}`}
            isFilled={filled}
            summaryPrimary={
              edu.degree && edu.field
                ? `${edu.degree}, ${edu.field}`
                : edu.degree || edu.school || 'Untitled entry'
            }
            summarySecondary={
              edu.school
                ? `${edu.school}${
                    edu.startDate || edu.endDate
                      ? ` · ${edu.startDate}–${edu.endDate || '…'}`
                      : ''
                  }`
                : ''
            }
            onRemove={() => removeEdu(edu.id)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup
                label="School / University"
                required
                error={errors?.[`education.${index}.school`]}
              >
                <Input
                  error={errors?.[`education.${index}.school`]}
                  value={edu.school}
                  onChange={e => updateEdu(edu.id, 'school', e.target.value)}
                  placeholder="e.g. Stanford University, NYU, State University"
                />
              </InputGroup>
              <InputGroup
                label="Degree"
                required
                error={errors?.[`education.${index}.degree`]}
              >
                <Input
                  error={errors?.[`education.${index}.degree`]}
                  value={edu.degree}
                  onChange={e => updateEdu(edu.id, 'degree', e.target.value)}
                  placeholder="e.g. Bachelor of Arts, BSN, MBA, High School Diploma"
                />
              </InputGroup>
              <InputGroup
                label="Field of study"
                required
                error={errors?.[`education.${index}.field`]}
              >
                <Input
                  error={errors?.[`education.${index}.field`]}
                  value={edu.field}
                  onChange={e => updateEdu(edu.id, 'field', e.target.value)}
                  placeholder="e.g. Nursing, Business, Education, Computer Science"
                />
              </InputGroup>
              <div className="grid grid-cols-2 gap-3">
                <InputGroup
                  label="Start year"
                  required
                  error={errors?.[`education.${index}.startDate`]}
                >
                  <Input
                    error={errors?.[`education.${index}.startDate`]}
                    value={edu.startDate}
                    onChange={e =>
                      updateEdu(edu.id, 'startDate', e.target.value)
                    }
                    placeholder="2018"
                  />
                </InputGroup>
                <InputGroup
                  label="End year"
                  required
                  error={errors?.[`education.${index}.endDate`]}
                >
                  <Input
                    error={errors?.[`education.${index}.endDate`]}
                    value={edu.endDate}
                    onChange={e => updateEdu(edu.id, 'endDate', e.target.value)}
                    placeholder="2022"
                  />
                </InputGroup>
              </div>
              <InputGroup
                label="GPA / CGPA"
                optional
                helper="Only if it helps you — skip otherwise."
                className="md:col-span-2"
              >
                <Input
                  value={edu.gpa || ''}
                  onChange={e => updateEdu(edu.id, 'gpa', e.target.value)}
                  placeholder="e.g. 3.8/4.0 or 8.5/10"
                />
              </InputGroup>
            </div>
          </CollapsibleItem>
        );
      })}

      <AddButton onClick={addEdu} label="Add education" />
    </div>
  );
};

export const SkillsStep: React.FC<{
  data: string[];
  update: (d: string[]) => void;
  userType?: UserType;
  /**
   * Job description text. When present, drives the "From this job description"
   * suggestion section via fuse.js fuzzy-matching against the skill pool.
   * Builder passes `targetJob.description`; profile setup passes nothing.
   */
  jdText?: string;
  /**
   * Skills the user has previously added to their profile. Surfaced first in
   * the suggestion pool — these are "yours", not generic dictionary picks.
   */
  profilePool?: string[];
}> = ({ data, update, userType, jdText, profilePool = [] }) => {
  const [currentSkill, setCurrentSkill] = useState('');

  const addSkill = (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = currentSkill.trim();
    if (!value) return;
    if (!data.includes(value)) update([...data, value]);
    setCurrentSkill('');
  };

  const addSuggested = (skill: string) => {
    if (!data.includes(skill)) update([...data, skill]);
  };

  const removeSkill = (skill: string) =>
    update(data.filter(s => s !== skill));

  // Broad-by-design starter chips. The AI reorders + prunes at generation
  // time against the JD, so it's safe to seed a wide net.
  const starterChips =
    userType === 'student'
      ? [
          'Communication', 'Teamwork', 'Problem solving', 'Time management',
          'Leadership', 'Writing', 'Microsoft Excel', 'Research',
          'Public speaking', 'Customer service',
        ]
      : [
          'Stakeholder management', 'Project management', 'Data analysis',
          'Cross-functional collaboration', 'Coaching', 'Strategy',
          'Process improvement', 'Budgeting', 'Microsoft Excel', 'SQL',
        ];

  // Canonical pool — profile skills first, then the curated dictionary.
  // Used by the extractor for canonical naming ("react" → "React") and for
  // its high-precision Pass A.
  const canonicalPool = useMemo(
    () => buildSkillPool(profilePool, []),
    [profilePool],
  );

  // True extraction — finds skills *from* the JD via 4 passes (known-match,
  // intro-phrase, section-bullet, capitalized-frequency). Surfaces niche
  // skills the dictionary doesn't know (Snowflake, Datadog, custom internal
  // tools), normalised to canonical names where possible. Already-added
  // skills are filtered via `exclude`. Pure client-side, no API call.
  const jdMatched = useMemo(
    () =>
      extractSkillsFromJD(jdText ?? '', {
        knownSkills: canonicalPool,
        exclude: data,
        maxResults: 24,
      }),
    [jdText, canonicalPool, data],
  );

  // Lower-priority "common picks" — starter chips for the user type, minus
  // anything already added or already shown in the JD section.
  const moreSuggestions = useMemo(() => {
    const taken = new Set([
      ...data.map(s => s.toLowerCase()),
      ...jdMatched.map(s => s.toLowerCase()),
    ]);
    const out: string[] = [];
    const seen = new Set<string>();
    for (const s of starterChips) {
      const k = s.toLowerCase();
      if (taken.has(k) || seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
    return out;
  }, [data, jdMatched, starterChips]);

  const count = data.length;
  const hasJdMatches = jdMatched.length > 0;

  // Encouraging count vibe — purely cosmetic, no validation behaviour.
  const countLabel =
    count === 0
      ? 'Add a few to get started'
      : count < 6
        ? `${count} so far — keep going`
        : count <= 18
          ? `${count} skills — solid list`
          : `${count} skills — long, but the AI will trim`;
  const countTone =
    count === 0
      ? 'text-charcoal-500'
      : count >= 6 && count <= 18
        ? 'text-accent-700'
        : 'text-charcoal-600';

  return (
    <div>
      <SectionHeader
        eyebrow="Your work"
        title="Skills"
        desc="A mix of tools you use (React, Excel, Figma) and ways you work (leadership, negotiation). The AI ranks them against the job description and trims the list later — so you don't need to overthink the order or count."
      />

      <MiniGuide>
        <strong>Cast a wide net.</strong> Mix specific tools (SEMrush, NumPy,
        Adobe Suite) with the soft skills you'd actually defend in an interview
        (coaching, stakeholder management). The AI prunes anything irrelevant
        when it tailors the resume.
      </MiniGuide>

      {/* Add input */}
      <form
        onSubmit={addSkill}
        className="mt-6 flex flex-col sm:flex-row gap-2"
      >
        <Input
          value={currentSkill}
          onChange={e => setCurrentSkill(e.target.value)}
          placeholder="Type a skill, then press Enter or click Add"
          className="flex-1"
          autoComplete="off"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand-700 text-charcoal-50 rounded-lg font-semibold text-sm hover:bg-brand-800 transition-colors disabled:opacity-50"
          disabled={!currentSkill.trim()}
        >
          <Plus size={15} /> Add
        </button>
      </form>

      {/* JD-matched suggestions — saffron prominent. Surfaces the user's own
          profile skills + curated dictionary entries that actually appear in
          the job description. Powered by fuse.js fuzzy matching. */}
      {hasJdMatches && (
        <div className="mt-7 rounded-2xl border border-accent-300 bg-accent-50/80 p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-400 text-brand-800 flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-accent-700 font-semibold">
                  From this job description
                </p>
                <p className="text-[13.5px] text-brand-700 leading-snug mt-0.5 max-w-md">
                  We matched these against the JD you pasted. Click to add — the
                  AI will polish them for the resume.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-accent-700 font-semibold whitespace-nowrap">
              {jdMatched.length} matched
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {jdMatched.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => addSuggested(chip)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-400 border border-accent-500 text-brand-800 text-sm font-semibold hover:bg-accent-300 transition-colors"
              >
                <Plus size={12} className="text-brand-700" />
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Common picks — neutral fallback chips. Always shown if the user-type
          starter list still has unselected items, so even users without a JD
          have something to click. */}
      {moreSuggestions.length > 0 && (
        <div className="mt-7">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500 font-semibold">
              {hasJdMatches ? 'Other common picks' : 'Common picks · click to add'}
            </p>
            <p className="text-[11px] text-charcoal-500">
              {userType === 'student' ? 'Student-friendly' : 'Pro-friendly'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {moreSuggestions.map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => addSuggested(chip)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-charcoal-200 bg-white text-charcoal-700 text-sm font-medium hover:border-accent-300 hover:bg-accent-50 hover:text-brand-700 transition-colors"
              >
                <Plus size={12} />
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Your skills — clean tag chips (light bg, charcoal border, ink text).
          The previous heavy-ink pills looked like a wall; these read as data
          tags so 20+ skills don't feel oppressive. */}
      <div className="mt-8 rounded-2xl border border-charcoal-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-brand-700 font-semibold">
              Your skills
            </span>
            {count > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-full bg-brand-700 text-charcoal-50 text-[11px] font-semibold leading-none">
                {count}
              </span>
            )}
          </div>
          <p className={`text-xs font-semibold ${countTone}`}>{countLabel}</p>
        </div>
        {count === 0 ? (
          <div className="rounded-xl border border-dashed border-charcoal-200 bg-charcoal-50/60 px-5 py-7 text-center">
            <p className="text-sm text-charcoal-500">
              Nothing here yet — type one above, or click any suggestion.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {data.map(skill => (
              <span
                key={skill}
                className="group inline-flex items-center gap-1 pl-2.5 pr-1 py-[5px] rounded-md bg-charcoal-50 border border-charcoal-200 text-brand-700 text-[13px] font-medium hover:border-charcoal-300 hover:bg-white transition-colors"
              >
                <span className="leading-none">{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-0.5 w-[18px] h-[18px] inline-flex items-center justify-center rounded text-charcoal-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label={`Remove ${skill}`}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const ExtracurricularStep: React.FC<{
  data: Extracurricular[];
  errors?: Record<string, string>;
  update: (d: Extracurricular[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () =>
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        title: '',
        organization: '',
        startDate: '',
        endDate: '',
        description: '',
        refinedBullets: [],
      },
    ]);

  const removeItem = (id: string) => update(data.filter(i => i.id !== id));
  const updateItem = (
    id: string,
    field: keyof Extracurricular,
    value: unknown,
  ) => update(data.map(i => (i.id === id ? { ...i, [field]: value } : i)));

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Credentials"
        title="Extracurricular activities"
        desc="Leadership roles, clubs, student government, sports teams, volunteering. These signal initiative — especially valuable before you have a full work history."
      />

      <TipCard
        title="What makes a strong activity entry"
        rules={[
          'A role with responsibility beats "member". Treasurer > member; captain > player.',
          'Describe one thing you led, organized, or delivered — with a number.',
          'Short is fine. One sentence of real impact beats three of filler.',
        ]}
        examples={[
          'President, Debate Club — ran weekly meetings for 30+ members; team placed top-3 at regionals.',
          'Volunteer coordinator, Red Cross — organized 3 fundraisers; raised $8K.',
          'Captain, Varsity Soccer — led 18-player roster; team ranked 2nd in the league.',
        ]}
      />

      {data.map((item, index) => {
        const filled = !!item.title.trim() && !!item.organization.trim();
        return (
          <CollapsibleItem
            key={item.id}
            icon={<Users size={16} />}
            indexLabel={`Activity ${index + 1}`}
            isFilled={filled}
            summaryPrimary={
              item.title && item.organization
                ? `${item.title} · ${item.organization}`
                : item.title || item.organization
            }
            summarySecondary={dateRange(item.startDate, item.endDate)}
            onRemove={() => removeItem(item.id)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup
                label="Role / Title"
                required
                error={errors?.[`extracurriculars.${index}.title`]}
              >
                <Input
                  error={errors?.[`extracurriculars.${index}.title`]}
                  value={item.title}
                  onChange={e => updateItem(item.id, 'title', e.target.value)}
                  placeholder="e.g. President, Volunteer Coordinator, Team Captain"
                />
              </InputGroup>
              <InputGroup
                label="Organization"
                required
                error={errors?.[`extracurriculars.${index}.organization`]}
              >
                <Input
                  error={errors?.[`extracurriculars.${index}.organization`]}
                  value={item.organization}
                  onChange={e =>
                    updateItem(item.id, 'organization', e.target.value)
                  }
                  placeholder="e.g. Debate Club, Red Cross, Habitat for Humanity"
                />
              </InputGroup>
              <InputGroup
                label="Start date"
                required
                error={errors?.[`extracurriculars.${index}.startDate`]}
              >
                <MonthPicker
                  isError={!!errors?.[`extracurriculars.${index}.startDate`]}
                  value={item.startDate}
                  onChange={val => updateItem(item.id, 'startDate', val)}
                />
              </InputGroup>
              <InputGroup
                label="End date"
                required
                error={errors?.[`extracurriculars.${index}.endDate`]}
              >
                <MonthPicker
                  isError={!!errors?.[`extracurriculars.${index}.endDate`]}
                  value={item.endDate}
                  onChange={val => updateItem(item.id, 'endDate', val)}
                />
              </InputGroup>
            </div>
            <InputGroup label="What did you do here?" optional>
              <PromptList
                prompts={[
                  'What did you organize, lead, or coordinate?',
                  'How many people, hours, or dollars were involved?',
                  'What was the outcome — placements, funds raised, members trained?',
                ]}
              />
              <PolishHint />
              <TextArea
                rows={3}
                value={item.description}
                onChange={e =>
                  updateItem(item.id, 'description', e.target.value)
                }
                placeholder="e.g. Ran weekly meetings for 30+ members, organized 3 community fundraisers that raised $8K total, and mentored 12 new members through their first year."
              />
              <WritingChecklist text={item.description} />
            </InputGroup>
          </CollapsibleItem>
        );
      })}

      <AddButton onClick={addItem} label="Add activity" />
    </div>
  );
};

export const AwardsStep: React.FC<{
  data: Award[];
  errors?: Record<string, string>;
  update: (d: Award[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () =>
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        title: '',
        issuer: '',
        date: '',
        description: '',
      },
    ]);
  const removeItem = (id: string) => update(data.filter(x => x.id !== id));
  const updateItem = (id: string, field: keyof Award, value: string) =>
    update(data.map(i => (i.id === id ? { ...i, [field]: value } : i)));

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Credentials"
        title="Awards & honors"
        desc="Scholarships, competitions, employee recognition, deans' lists — anything someone else decided to give you."
      />

      <MiniGuide icon={<AwardIcon size={14} />}>
        <strong>Even one belongs.</strong> External, recent, and named awards
        carry the most weight. A Dean's List, an Employee of the Quarter, or a
        scholarship you actually won is worth listing — informal kudos isn't.
      </MiniGuide>

      {data.map((item, i) => {
        const filled = !!item.title.trim() && !!item.issuer.trim();
        return (
          <CollapsibleItem
            key={item.id}
            icon={<AwardIcon size={16} />}
            indexLabel={`Award ${i + 1}`}
            isFilled={filled}
            summaryPrimary={item.title || 'Untitled award'}
            summarySecondary={
              [item.issuer, formatMonth(item.date)].filter(Boolean).join(' · ')
            }
            onRemove={() => removeItem(item.id)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup
                label="Award title"
                required
                error={errors?.[`awards.${i}.title`]}
              >
                <Input
                  error={errors?.[`awards.${i}.title`]}
                  value={item.title}
                  onChange={e => updateItem(item.id, 'title', e.target.value)}
                  placeholder="e.g. Dean's List, Employee of the Year, Rising Star"
                />
              </InputGroup>
              <InputGroup
                label="Issuer"
                required
                error={errors?.[`awards.${i}.issuer`]}
              >
                <Input
                  error={errors?.[`awards.${i}.issuer`]}
                  value={item.issuer}
                  onChange={e => updateItem(item.id, 'issuer', e.target.value)}
                  placeholder="e.g. University, Hospital Board, Chamber of Commerce"
                />
              </InputGroup>
              <InputGroup
                label="Date"
                required
                error={errors?.[`awards.${i}.date`]}
              >
                <MonthPicker
                  isError={!!errors?.[`awards.${i}.date`]}
                  value={item.date}
                  onChange={val => updateItem(item.id, 'date', val)}
                />
              </InputGroup>
            </div>
            <InputGroup
              label="Description"
              optional
              helper="One short line about why it was awarded."
            >
              <TextArea
                rows={2}
                value={item.description}
                onChange={e =>
                  updateItem(item.id, 'description', e.target.value)
                }
              />
            </InputGroup>
          </CollapsibleItem>
        );
      })}

      <AddButton onClick={addItem} label="Add award" />
    </div>
  );
};

export const CertificationsStep: React.FC<{
  data: Certification[];
  errors?: Record<string, string>;
  update: (d: Certification[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () =>
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        name: '',
        issuer: '',
        date: '',
        link: '',
      },
    ]);
  const removeItem = (id: string) => update(data.filter(x => x.id !== id));
  const updateItem = (id: string, field: keyof Certification, value: string) =>
    update(data.map(i => (i.id === id ? { ...i, [field]: value } : i)));

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Credentials"
        title="Certifications"
        desc="Current professional certifications, licenses, and industry credentials. Relevant ones only — don't pad."
      />

      <MiniGuide icon={<AwardIcon size={14} />}>
        <strong>Active credentials only.</strong> If it's expired or
        unrelated to the role you're targeting, leave it out. In regulated
        fields (healthcare, accounting, law, cloud, security) one or two
        right-fit certs can do real work.
      </MiniGuide>

      {data.map((item, i) => {
        const filled = !!item.name.trim() && !!item.issuer.trim();
        return (
          <CollapsibleItem
            key={item.id}
            icon={<AwardIcon size={16} />}
            indexLabel={`Certification ${i + 1}`}
            isFilled={filled}
            summaryPrimary={item.name || 'Untitled certification'}
            summarySecondary={
              [item.issuer, formatMonth(item.date)].filter(Boolean).join(' · ')
            }
            onRemove={() => removeItem(item.id)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup
                label="Certification name"
                required
                error={errors?.[`certifications.${i}.name`]}
              >
                <Input
                  error={errors?.[`certifications.${i}.name`]}
                  value={item.name}
                  onChange={e => updateItem(item.id, 'name', e.target.value)}
                  placeholder="e.g. PMP, CPA, RN License, AWS Solutions Architect"
                />
              </InputGroup>
              <InputGroup
                label="Issuer"
                required
                error={errors?.[`certifications.${i}.issuer`]}
              >
                <Input
                  error={errors?.[`certifications.${i}.issuer`]}
                  value={item.issuer}
                  onChange={e => updateItem(item.id, 'issuer', e.target.value)}
                  placeholder="e.g. PMI, State Board, AICPA, AWS"
                />
              </InputGroup>
              <InputGroup
                label="Issued"
                required
                error={errors?.[`certifications.${i}.date`]}
              >
                <MonthPicker
                  isError={!!errors?.[`certifications.${i}.date`]}
                  value={item.date}
                  onChange={val => updateItem(item.id, 'date', val)}
                />
              </InputGroup>
              <InputGroup label="Verification link" optional>
                <Input
                  type="url"
                  value={item.link || ''}
                  onChange={e => updateItem(item.id, 'link', e.target.value)}
                  placeholder="https://…"
                />
              </InputGroup>
            </div>
          </CollapsibleItem>
        );
      })}

      <AddButton onClick={addItem} label="Add certification" />
    </div>
  );
};

export const AffiliationsStep: React.FC<{
  data: Affiliation[];
  errors?: Record<string, string>;
  update: (d: Affiliation[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () =>
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        organization: '',
        role: '',
        startDate: '',
        endDate: '',
      },
    ]);
  const removeItem = (id: string) => update(data.filter(x => x.id !== id));
  const updateItem = (id: string, field: keyof Affiliation, value: string) =>
    update(data.map(i => (i.id === id ? { ...i, [field]: value } : i)));

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Credentials"
        title="Professional affiliations"
        desc="Active memberships in professional bodies — bar associations, nursing boards, industry societies."
      />

      <MiniGuide icon={<Building2 size={14} />}>
        <strong>Real bodies only.</strong> Bar association, nursing board,
        IEEE, AIGA, AMA — memberships that signal credibility in your field.
        Skip clubs and informal groups (those belong in Activities, not here).
      </MiniGuide>

      {data.map((item, i) => {
        const filled = !!item.organization.trim() && !!item.role.trim();
        return (
          <CollapsibleItem
            key={item.id}
            icon={<Building2 size={16} />}
            indexLabel={`Affiliation ${i + 1}`}
            isFilled={filled}
            summaryPrimary={
              item.role && item.organization
                ? `${item.role} · ${item.organization}`
                : item.role || item.organization
            }
            summarySecondary={dateRange(item.startDate, item.endDate)}
            onRemove={() => removeItem(item.id)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup
                label="Organization"
                required
                error={errors?.[`affiliations.${i}.organization`]}
              >
                <Input
                  error={errors?.[`affiliations.${i}.organization`]}
                  value={item.organization}
                  onChange={e =>
                    updateItem(item.id, 'organization', e.target.value)
                  }
                  placeholder="e.g. American Bar Association, ANA, IEEE, AIGA"
                />
              </InputGroup>
              <InputGroup
                label="Role"
                required
                error={errors?.[`affiliations.${i}.role`]}
              >
                <Input
                  error={errors?.[`affiliations.${i}.role`]}
                  value={item.role}
                  onChange={e => updateItem(item.id, 'role', e.target.value)}
                  placeholder="e.g. Member, Board Member, Chair"
                />
              </InputGroup>
              <InputGroup
                label="Start date"
                required
                error={errors?.[`affiliations.${i}.startDate`]}
              >
                <MonthPicker
                  isError={!!errors?.[`affiliations.${i}.startDate`]}
                  value={item.startDate}
                  onChange={val => updateItem(item.id, 'startDate', val)}
                />
              </InputGroup>
              <InputGroup
                label="End date"
                required
                error={errors?.[`affiliations.${i}.endDate`]}
              >
                <MonthPicker
                  isError={!!errors?.[`affiliations.${i}.endDate`]}
                  value={item.endDate}
                  onChange={val => updateItem(item.id, 'endDate', val)}
                />
              </InputGroup>
            </div>
          </CollapsibleItem>
        );
      })}

      <AddButton onClick={addItem} label="Add affiliation" />
    </div>
  );
};

export const PublicationsStep: React.FC<{
  data: Publication[];
  errors?: Record<string, string>;
  update: (d: Publication[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () =>
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        title: '',
        publisher: '',
        date: '',
        link: '',
      },
    ]);
  const removeItem = (id: string) => update(data.filter(x => x.id !== id));
  const updateItem = (id: string, field: keyof Publication, value: string) =>
    update(data.map(i => (i.id === id ? { ...i, [field]: value } : i)));

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Credentials"
        title="Publications & presentations"
        desc="Papers, articles, op-eds, case studies, conference talks, media features. Anything with a byline or a stage."
      />

      <MiniGuide icon={<BookOpen size={14} />}>
        <strong>Anything with a byline or a stage.</strong> Peer-reviewed
        papers, op-eds, conference talks, podcast features, case studies on a
        company blog. Skip personal social posts and short blog notes.
      </MiniGuide>

      {data.map((item, i) => {
        const filled = !!item.title.trim() && !!(item.publisher || '').trim();
        return (
          <CollapsibleItem
            key={item.id}
            icon={<BookOpen size={16} />}
            indexLabel={`Publication ${i + 1}`}
            isFilled={filled}
            summaryPrimary={item.title || 'Untitled publication'}
            summarySecondary={
              [item.publisher, formatMonth(item.date)].filter(Boolean).join(' · ')
            }
            onRemove={() => removeItem(item.id)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup
                label="Title"
                required
                error={errors?.[`publications.${i}.title`]}
              >
                <Input
                  error={errors?.[`publications.${i}.title`]}
                  value={item.title}
                  onChange={e => updateItem(item.id, 'title', e.target.value)}
                  placeholder="e.g. Nursing Care Best Practices; The Future of B2B Marketing"
                />
              </InputGroup>
              <InputGroup
                label="Publisher / Conference"
                required
                error={errors?.[`publications.${i}.publisher`]}
              >
                <Input
                  error={errors?.[`publications.${i}.publisher`]}
                  value={item.publisher || ''}
                  onChange={e =>
                    updateItem(item.id, 'publisher', e.target.value)
                  }
                  placeholder="e.g. Harvard Business Review, JAMA, Medium, NeurIPS"
                />
              </InputGroup>
              <InputGroup
                label="Date"
                required
                error={errors?.[`publications.${i}.date`]}
              >
                <MonthPicker
                  isError={!!errors?.[`publications.${i}.date`]}
                  value={item.date}
                  onChange={val => updateItem(item.id, 'date', val)}
                />
              </InputGroup>
              <InputGroup label="Link" optional>
                <Input
                  type="url"
                  value={item.link || ''}
                  onChange={e => updateItem(item.id, 'link', e.target.value)}
                  placeholder="https://…"
                />
              </InputGroup>
            </div>
          </CollapsibleItem>
        );
      })}

      <AddButton onClick={addItem} label="Add publication" />
    </div>
  );
};

// Languages — common in Bangladesh CVs (Bengali + English baseline) and useful
// globally for multilingual roles. Compact row layout — name + proficiency
// dropdown — since each item is just two short fields.
const LANGUAGE_PROFICIENCIES: LanguageProficiency[] = [
  'Native', 'Fluent', 'Professional', 'Conversational', 'Basic',
];

export const LanguagesStep: React.FC<{
  data: Language[];
  errors?: Record<string, string>;
  update: (d: Language[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () =>
    update([
      ...data,
      { id: crypto.randomUUID(), name: '', proficiency: 'Professional' },
    ]);
  const removeItem = (id: string) => update(data.filter(x => x.id !== id));
  const updateItem = (id: string, field: keyof Language, value: string) =>
    update(data.map(i => (i.id === id ? { ...i, [field]: value } : i)));

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Background"
        title="Languages"
        desc="Spoken and written languages with your proficiency level. Especially valued in Bangladesh, MNCs, and any role with international or client-facing scope."
      />

      <MiniGuide icon={<LanguagesIcon size={14} />}>
        <strong>List languages you can actually work in.</strong> Native = mother
        tongue; Fluent = effortless speech and writing; Professional = comfortable
        in business contexts; Conversational = day-to-day chat; Basic = greetings
        and simple sentences. Don't list a language you can't hold a meeting in.
      </MiniGuide>

      <div className="space-y-3">
        {data.map((item, i) => (
          <div
            key={item.id}
            className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 items-end p-4 rounded-2xl border border-charcoal-200 bg-white"
          >
            <InputGroup
              label="Language"
              required
              error={errors?.[`languages.${i}.name`]}
            >
              <Input
                error={errors?.[`languages.${i}.name`]}
                value={item.name}
                onChange={e => updateItem(item.id, 'name', e.target.value)}
                placeholder="e.g. Bengali, English, Hindi, Arabic"
              />
            </InputGroup>
            <InputGroup label="Proficiency" required>
              <select
                value={item.proficiency}
                onChange={e => updateItem(item.id, 'proficiency', e.target.value)}
                className="w-full rounded-lg border border-charcoal-300 hover:border-charcoal-400 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:border-accent-400 px-3.5 py-2.5 text-sm bg-white text-brand-800 focus:outline-none transition-colors"
              >
                {LANGUAGE_PROFICIENCIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </InputGroup>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="p-2 text-charcoal-500 hover:text-red-600 transition-colors"
              aria-label="Remove language"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <AddButton onClick={addItem} label="Add language" />
    </div>
  );
};

// References — standard in Bangladesh CVs (banks, conglomerates, gov't roles
// often expect 2–3 named referees with phone + email). Optional in most global
// resumes, gated behind the section selector.
export const ReferencesStep: React.FC<{
  data: Reference[];
  errors?: Record<string, string>;
  update: (d: Reference[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () =>
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        name: '',
        position: '',
        organization: '',
        email: '',
        phone: '',
        relationship: '',
      },
    ]);
  const removeItem = (id: string) => update(data.filter(x => x.id !== id));
  const updateItem = (id: string, field: keyof Reference, value: string) =>
    update(data.map(i => (i.id === id ? { ...i, [field]: value } : i)));

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Credentials"
        title="References"
        desc="Named referees with phone and email. Common on Bangladeshi CVs (banks, conglomerates, gov't); optional globally — most international resumes use 'References available upon request' instead."
      />

      <MiniGuide icon={<UserCheck size={14} />}>
        <strong>2–3 referees, never close relatives.</strong> Pick people who've
        seen your work — direct managers, professors, project supervisors. Always
        ask permission before listing someone. Include role + organization so the
        recruiter knows the relationship's weight.
      </MiniGuide>

      {data.map((item, i) => {
        const filled = !!item.name.trim() && !!item.email.trim();
        return (
          <CollapsibleItem
            key={item.id}
            icon={<UserCheck size={16} />}
            indexLabel={`Reference ${i + 1}`}
            isFilled={filled}
            summaryPrimary={item.name || 'Unnamed reference'}
            summarySecondary={
              [item.position, item.organization].filter(Boolean).join(' · ')
            }
            onRemove={() => removeItem(item.id)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup
                label="Full name"
                required
                error={errors?.[`references.${i}.name`]}
              >
                <Input
                  error={errors?.[`references.${i}.name`]}
                  value={item.name}
                  onChange={e => updateItem(item.id, 'name', e.target.value)}
                  placeholder="e.g. Dr. Tahmid Rahman"
                />
              </InputGroup>
              <InputGroup
                label="Position / Title"
                required
                error={errors?.[`references.${i}.position`]}
              >
                <Input
                  error={errors?.[`references.${i}.position`]}
                  value={item.position}
                  onChange={e => updateItem(item.id, 'position', e.target.value)}
                  placeholder="e.g. Head of Engineering"
                />
              </InputGroup>
              <InputGroup
                label="Organization"
                required
                error={errors?.[`references.${i}.organization`]}
              >
                <Input
                  error={errors?.[`references.${i}.organization`]}
                  value={item.organization}
                  onChange={e => updateItem(item.id, 'organization', e.target.value)}
                  placeholder="e.g. BRAC Bank, Grameenphone, North South University"
                />
              </InputGroup>
              <InputGroup
                label="Email"
                required
                error={errors?.[`references.${i}.email`]}
              >
                <Input
                  type="email"
                  error={errors?.[`references.${i}.email`]}
                  value={item.email}
                  onChange={e => updateItem(item.id, 'email', e.target.value)}
                  placeholder="name@company.com"
                />
              </InputGroup>
              <InputGroup
                label="Phone"
                required
                error={errors?.[`references.${i}.phone`]}
              >
                <Input
                  error={errors?.[`references.${i}.phone`]}
                  value={item.phone}
                  onChange={e => updateItem(item.id, 'phone', e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                />
              </InputGroup>
              <InputGroup
                label="Relationship"
                optional
                helper="How they know you and over what period. One short line."
              >
                <Input
                  value={item.relationship || ''}
                  onChange={e => updateItem(item.id, 'relationship', e.target.value)}
                  placeholder="e.g. Direct manager at Northwind, 2023–present"
                />
              </InputGroup>
            </div>
          </CollapsibleItem>
        );
      })}

      <AddButton onClick={addItem} label="Add reference" />
    </div>
  );
};

export const SectionSelectionStep: React.FC<{
  selected: string[];
  update: (sections: string[]) => void;
  userType?: UserType;
}> = ({ selected, update, userType }) => {
  const sections = [
    {
      id: 'experience',
      label: 'Experience',
      icon: <Briefcase size={18} />,
      hint: userType === 'experienced'
        ? 'Recommended — your work history is the core of the resume.'
        : 'Include if you have any paid roles to show.',
    },
    {
      id: 'education',
      label: 'Education',
      icon: <GraduationCap size={18} />,
      hint: 'Almost always on. Skip only if you have 10+ years of experience and a filled-to-the-brim resume.',
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FolderGit2 size={18} />,
      hint: userType === 'student'
        ? 'Recommended — projects carry most of your resume.'
        : 'Great for showing side work, research, or portfolio pieces.',
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: <Sparkles size={18} />,
      hint: 'Almost always on. Helps the ATS parser match keywords.',
    },
    {
      id: 'extracurriculars',
      label: 'Activities',
      icon: <Users size={18} />,
      hint: 'Strongest when you have leadership roles; fine to skip if nothing stands out.',
    },
    {
      id: 'awards',
      label: 'Awards',
      icon: <AwardIcon size={18} />,
      hint: 'Worth including if they\'re external and recent.',
    },
    {
      id: 'certifications',
      label: 'Certifications',
      icon: <AwardIcon size={18} />,
      hint: 'Important in regulated fields — healthcare, accounting, law, cloud.',
    },
    {
      id: 'affiliations',
      label: 'Affiliations',
      icon: <Users size={18} />,
      hint: 'Include only active memberships in well-known bodies.',
    },
    {
      id: 'publications',
      label: 'Publications',
      icon: <BookOpen size={18} />,
      hint: 'Academic, clinical, or thought-leadership. Skip short blog posts.',
    },
    {
      id: 'languages',
      label: 'Languages',
      icon: <LanguagesIcon size={18} />,
      hint: 'Strongly recommended for Bangladesh, MNCs, or any client-facing role with international scope.',
    },
    {
      id: 'references',
      label: 'References',
      icon: <UserCheck size={18} />,
      hint: 'Common on Bangladeshi CVs (banks, conglomerates, gov\'t). Skip for most international resumes.',
    },
  ];

  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      update(selected.filter(s => s !== id));
    } else {
      update([...selected, id]);
    }
  };

  const coreIds = new Set(['experience', 'education', 'projects', 'skills']);
  const coreSections = sections.filter(s => coreIds.has(s.id));
  const extraSections = sections.filter(s => !coreIds.has(s.id));

  const renderSectionCard = ({
    id,
    label,
    icon,
    hint,
  }: (typeof sections)[number]) => {
    const isSelected = selected.includes(id);
    return (
      <button
        key={id}
        type="button"
        onClick={() => handleToggle(id)}
        className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all text-left ${
          isSelected
            ? 'border-accent-400 bg-accent-50/60 shadow-sm'
            : 'border-charcoal-200 bg-white hover:border-charcoal-400'
        }`}
        aria-pressed={isSelected}
      >
        <div
          className={`p-2 rounded-lg shrink-0 transition-colors ${
            isSelected
              ? 'bg-brand-700 text-accent-300'
              : 'bg-charcoal-100 text-brand-600'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-brand-700">{label}</h3>
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                isSelected
                  ? 'border-accent-500 bg-accent-500 text-white'
                  : 'border-charcoal-300 bg-white'
              }`}
            >
              {isSelected && <Check size={12} strokeWidth={3} />}
            </div>
          </div>
          <p className="text-xs text-charcoal-500 leading-relaxed">{hint}</p>
        </div>
      </button>
    );
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Your resume"
        title="Which sections should we include?"
        desc="Turn on only the sections you have real content for — empty sections hurt more than they help. You can always come back and add more."
      />

      {/* Counter banner — ink-dark anchor for the page */}
      <div className="rounded-2xl bg-brand-700 text-charcoal-50 px-5 sm:px-6 py-5 mb-7 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-accent-300 font-semibold">
            On your resume
          </p>
          <p className="font-display text-xl sm:text-2xl font-semibold leading-tight mt-0.5">
            <span className="text-accent-400">{selected.length}</span>{' '}
            <span className="text-charcoal-300">of {sections.length} sections selected</span>
          </p>
        </div>
        <p className="hidden sm:block text-xs text-charcoal-300 max-w-[180px] text-right leading-relaxed">
          Tap a card to toggle. You can change this anytime.
        </p>
      </div>

      {/* Core */}
      <div className="mb-7">
        <div className="flex items-baseline justify-between mb-3 gap-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold">
            Core sections
          </p>
          <p className="text-[11px] text-charcoal-500">
            Almost every resume has these
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {coreSections.map(renderSectionCard)}
        </div>
      </div>

      {/* Extras */}
      <div>
        <div className="flex items-baseline justify-between mb-3 gap-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-charcoal-500 font-semibold">
            Extras
          </p>
          <p className="text-[11px] text-charcoal-500">
            Add any you have real content for
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {extraSections.map(renderSectionCard)}
        </div>
      </div>
    </div>
  );
};
