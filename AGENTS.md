# AGENTS.md — TOP CANDIDATE

> Single source of truth for AI agents (Claude Code, Cursor, Antigravity, etc.) working on this repo.
> Read this before touching code. Updating this file is **part of every change** — see the maintenance protocol below.

---

## 0. Maintenance protocol (read first)

This document is load-bearing. It is what keeps future agents from burning tokens re-crawling the project.

**After any of the following changes, update this file in the same commit:**

| Change type | What to update |
| --- | --- |
| Add / remove a domain entity | §5 Data model, §6 Application flow (if affected) |
| Add / remove a use case | §4 Architecture (use case list), §5 Data model (if types change) |
| Add / remove an AI generator | §4 Architecture, §9 External services, §6 Application flow |
| Add / remove a screen | §7 Key files, §6 Application flow |
| Change the database schema | §8 Database, and add a migration under `supabase/migrations/` |
| Change brand tokens, fonts, or palette | §10 Brand & design |
| Add a new env var | §12 Env vars |
| Add a new runtime dependency | §2 Tech stack |
| Change feature surface (ship/kill) | §3 Product surface |
| Add a new user-facing string | Add to `src/presentation/i18n/locales/en.ts` AND `bn.ts`, then use via `useT()` (§11) |

Also update `CLAUDE.md` if the change introduces a new rule agents must follow (e.g. "always do X when editing Y").
If a feature ships, delete its entry from §13 "Known debt / non-goals" once it is no longer a non-goal.

**Never** let this file drift. An outdated AGENTS.md is worse than none — it makes future agents confidently wrong.

---

## 1. What this is

**TOP CANDIDATE** is a career toolkit. A user pastes a job description, and an AI toolchain produces a complete, role-tailored application package:

1. **ATS-friendly resume** — tailored bullets, summary, skills
2. **Cover letter** — 250–400 word body, no boilerplate
3. **Outreach email** — cold email to a hiring manager (subject + body)
4. **LinkedIn connection note** — ≤ 280 chars
5. **Interview question prep** — 6–8 role-specific questions with why-asked + answer-strategy notes

A future mock-interview marketplace is planned but **out of scope** until explicitly flagged.

---

## 2. Tech stack

- **React 19** + **TypeScript 5.8** + **Vite 6**
- **Tailwind CSS** (via CDN, not PostCSS — config lives in `index.html`)
- **Internationalisation** — DIY typed dictionary at `src/presentation/i18n/` (no library). Two locales: `en` (default) and `bn` (বাংলা / Bengali). Switch via `<LanguageToggle />` in the navbar / landing / login. Locale persists in `localStorage` (`topcandidate.locale`) and is applied to `<html data-locale>` for font-stack swapping. See §10 for fonts and §11 for the convention.
- **AI providers** for resume optimization: **Groq** (`llama-3.3-70b-versatile`, primary — 1,000 RPD free, ~5–8s latency) → **Google Gemini 2.5 Flash** (fallback). Routed through `MultiProviderResumeOptimizer`. Toolkit generators (cover letter, outreach, LinkedIn, interview, extractor) are still Gemini-only. SDK: `@google/genai` for Gemini; plain `fetch` to `api.groq.com/openai/v1/chat/completions` for Groq
- **Server-side API proxy** — all AI calls go through Vercel Functions in `/api/*` (deployed automatically alongside the Vite app). Client holds NO provider keys. Auth via Supabase JWT bearer; per-user daily-cap rate limiting via the `ai_call_log` table.
- **Supabase** (`@supabase/supabase-js`) for auth + persistence
- **docx**, **jspdf**, **html2pdf.js** for export
- **Radix Popover**, **Lucide icons**, **Sonner** (toasts), **date-fns**
- **fuse.js** — fuzzy matching used inside our custom JD skill **extractor**
  at `src/presentation/utils/skillMatcher.ts`. The extractor (`extractSkillsFromJD`)
  runs four passes — known-skill match (regex + fuse), intro-phrase
  (`experience with X, Y`), section-aware bullet parsing
  (`Requirements:` / `Tech stack:`), and repeated-capitalized-phrase
  frequency. Scores + dedupes + canonicalises against the dictionary. Pure
  client-side, no Gemini call (would burn the 2-call budget).
- Import map in `index.html` for CDN-loaded modules (lucide-react, @google/genai, docx, etc.) — build also bundles locally

No monorepo, no workspaces. Single Vite app.

---

## 3. Product surface (currently shipped)

| Area | File entry point | Status |
| --- | --- | --- |
| Landing page | `src/presentation/LandingScreen.tsx` | shipped — rebranded, no gradients, Saffron/Ink palette |
| Auth (email + password) | `src/presentation/LoginScreen.tsx`, `src/infrastructure/auth/AuthContext.tsx` | shipped (Supabase Auth) |
| Profile setup (master profile) | `src/presentation/ProfileSetupScreen.tsx` | shipped — one-time profile capture used to seed future resumes |
| Dashboard (two-card action zone — Master vs. Tailor — + applications grid + slim consultant teaser) | `src/presentation/DashboardScreen.tsx` | shipped |
| Resume builder (multi-step form) | `src/presentation/BuilderScreen.tsx` | shipped |
| Resume preview + templates | `src/presentation/components/Preview.tsx`, `src/presentation/templates/TemplateRegistry.ts` | shipped (4 ATS-safe templates) |
| Cover letter generation + viewer | `src/infrastructure/ai/GeminiCoverLetterGenerator.ts`, viewer inside `Preview.tsx` | shipped |
| **Outreach email** generation + viewer | `src/infrastructure/ai/GeminiOutreachEmailGenerator.ts`, `src/presentation/components/Builder/ToolkitViewers.tsx` | shipped |
| **LinkedIn note** generation + viewer | `src/infrastructure/ai/GeminiLinkedInMessageGenerator.ts`, `ToolkitViewers.tsx` | shipped |
| **Interview Q prep** generation + viewer | `src/infrastructure/ai/GeminiInterviewQuestionsGenerator.ts`, `ToolkitViewers.tsx` | shipped |
| General Resume (profile-based, 24h regen cooldown) | `ResumeService.generateGeneralResume()` | shipped |
| Export (Word + PDF) for resume & cover letter | `src/infrastructure/export/` | shipped |
| Resume extract (from uploaded PDF/Word) | `src/infrastructure/ai/GeminiResumeExtractor.ts` | shipped |

---

## 4. Architecture (Clean Architecture)

Four layers, dependencies flow inward.

```
 ┌────────────────── Presentation (React) ───────────────────┐
 │  LandingScreen · LoginScreen · DashboardScreen            │
 │  ProfileSetupScreen · BuilderScreen · Preview             │
 │  components/Builder/ToolkitViewers · components/FormSteps │
 └────────────────────────────┬──────────────────────────────┘
                              ▼
 ┌──────────────────── Application ──────────────────────────┐
 │  ResumeService       — orchestrates all use cases         │
 └────────────────────────────┬──────────────────────────────┘
                              ▼
 ┌───────────────────── Domain (pure) ───────────────────────┐
 │  Entities:  ResumeData · OptimizedResumeData · JobToolkit │
 │             GeneratedToolkit · OutreachEmail ·            │
 │             InterviewQuestion · ...                       │
 │  Use cases: Optimize · Export · CoverLetter               │
 │             OutreachEmail · LinkedInMessage               │
 │             InterviewQuestions · Toolkit (combined) ·     │
 │             ExtractResume                                 │
 │  Repos:     IProfileRepository · IResumeRepository        │
 │             IApplicationRepository                        │
 └────────────────────────────▲──────────────────────────────┘
                              │ implements
 ┌──────────────────── Infrastructure (CLIENT) ──────────────┐
 │  AI:       Proxy{ResumeOptimizer, ToolkitGenerator,       │
 │              CoverLetterGenerator, OutreachEmailGenerator,│
 │              LinkedInMessageGenerator,                    │
 │              InterviewQuestionsGenerator, ResumeExtractor}│
 │            ↓ POST + Supabase JWT to:                      │
 │  Export:   CompositeResumeExporter (Word + PDF)           │
 │  Auth:     AuthContext (Supabase Auth)                    │
 │  Persist:  Supabase{Profile,Resume,Application}Repository │
 │  Config:   dependencies.ts (DI container — NO AI keys)    │
 └───────────────────────────┬───────────────────────────────┘
                             │ HTTPS
 ┌───────────────────────────▼───────────────────────────────┐
 │           Vercel Functions  (server, /api/*)              │
 │  api/optimize          — runs optimizer + toolkit (2 AI)  │
 │  api/toolkit-item      — single-item regenerate           │
 │  api/extract-resume    — PDF/Word extract                 │
 │  api/_lib/auth         — Supabase JWT verifier            │
 │  api/_lib/rateLimit    — daily cap (ai_call_log)          │
 │  api/_lib/aiFactory    — constructs:                      │
 │    MultiProviderResumeOptimizer (Groq → Gemini fallback)  │
 │    GeminiToolkitGenerator + 4 single-artifact generators  │
 │    GeminiResumeExtractor                                  │
 │  Shared: prompts/resumeOptimizerPrompts.ts                │
 │  Keys read from process.env.{GROQ,GEMINI}_API_KEY         │
 │  (NEVER VITE_-prefixed — server-only, never bundled)      │
 └───────────────────────────────────────────────────────────┘
```

**Rules:**
- **Domain** depends on nothing. Pure types and interfaces.
- **Application** depends on domain only.
- **Infrastructure** implements domain interfaces. Can import SDKs (Supabase, Gemini).
- **Presentation** depends on application + domain. Can read infrastructure via `dependencies.ts` but should prefer going through `ResumeService`.

**AI call budget:** initial generation runs exactly TWO concurrent Gemini calls — optimizer + combined toolkit (`GeminiToolkitGenerator`). Free-tier RPM is 5; historical 1-optimizer-plus-4-toolkit fan-out hit quota. Per-item regeneration still hits the single-artifact generators (one call per retry).

**Adding a new AI generator:** add an interface + use case in `domain/usecases/`, a Gemini implementation in `infrastructure/ai/`, wire it into `dependencies.ts`, inject into `ResumeService`. For single-item ancillary output, call it from `regenerateToolkitItem()` — NOT from `optimizeResume()`, which is restricted to the 2-call hot path. If you need to expand the initial toolkit, extend `GeminiToolkitGenerator`'s schema/prompt instead of adding a parallel call.

**Pre-flight content gates** live in `src/application/validation/` and run client-side before any AI call (in `ResumeService.optimizeResume`) and before signup (in `LoginScreen`). They are pure utilities — no SDK deps, no domain types — and exist to refuse work that would waste tokens or pollute the user pool. Two gates today:

- `gibberishDetector.ts` + `dictionaries.ts` — catches keyboard-mash on long free-form resume fields. Bengali Unicode passes through; romanized Banglish is rescued by a hand-curated word list. Conservative thresholds (errs toward letting borderline text through). Throws `GibberishContentError` with the offending field name; callers should pass `error.message` to `toast.error` rather than swallowing it.
- `emailValidator.ts` — signup gate using `validator.isEmail` for format, `disposable-email-domains` for known throwaways (lazy-imported, ~2 MB JSON kept out of the initial bundle), plus a local-part shape check. Async; only runs on signup, not login.

When adding a new AI entry point: add a corresponding `assertContentIsReal`-style gate at the top of the service method, listing the user-supplied free-form fields that feed the prompt. Skip short structured fields (names, dates, locations) — too noisy to score and not where waste comes from.

---

## 5. Data model (core types)

All defined in `src/domain/entities/Resume.ts`.

```ts
ResumeData {
  userType?: 'experienced' | 'student'
  targetJob: { title, company, description }
  personalInfo: { fullName, email, phone, location, linkedin?, github?, website? }
  summary: string                      // AI-generated
  experience: WorkExperience[]         // { id, company, role, dates, rawDescription, refinedBullets }
  projects: Project[]                  // { id, name, rawDescription, refinedBullets, technologies?, link? }
  education: Education[]
  skills: string[]
  extracurriculars? | awards? | certifications? | affiliations? | publications?
  languages?: Language[]               // Bengali / English / etc. + proficiency
  references?: Reference[]             // 2–3 named referees w/ phone + email (BD-common)
  coverLetter?: string                 // AI-generated
  toolkit?: JobToolkit                 // AI-generated sibling artifacts
  visibleSections?: string[]           // user's section selection
  template?: 'ats-classic' | 'ats-modern' | 'ats-serif' | 'ats-compact'
}

JobToolkit {
  outreachEmail?:      { subject: string, body: string }
  linkedInMessage?:    string              // ≤ 280 chars
  interviewQuestions?: InterviewQuestion[]
  errors?:             Partial<Record<string, string>>
}

InterviewQuestion {
  question:       string
  category:       'Behavioral' | 'Technical' | 'Role-specific'
                | 'Values & Culture' | 'Situational'
  whyAsked:       string
  answerStrategy: string
}

OptimizedResumeData {                    // what GeminiResumeOptimizer returns
  summary, skills, experience[].refinedBullets, projects[].refinedBullets,
  extracurriculars[].refinedBullets, coverLetter?, toolkit?
}
```

**AppStep enum** (`src/domain/entities/AppStep.ts`) drives the builder's multi-step form.
**Top-level screen routing** is driven by `useBrowserNav` (`src/presentation/hooks/useBrowserNav.ts`) — each transition pushes a `NavState` entry onto `window.history`, and the hook listens for `popstate` so browser back/forward buttons restore the previous screen. Use `navigate({ screen: 'LANDING' | 'LOGIN' | 'DASHBOARD' | 'PROFILE' | 'PROFILE_SETUP' | 'BUILDER' })` for every transition. Use `{ replace: true }` on auth-driven redirects (sign-in / sign-out / profile-setup → dashboard) so the back button doesn't bounce the user back through the auth flow.

---

## 6. Application flow (happy path for a new tailored application)

```
 User signs in ──► profileRepository.isProfileComplete() ──► ProfileSetupScreen (if incomplete)
                                                          └► DashboardScreen (if complete)

 DashboardScreen ──► "New Application" ──► ResumeSourceDialog
                                          ├── "Use my profile" ──► prefill ResumeData from profileRepository
                                          └── "Start fresh"    ──► empty ResumeData

 BuilderScreen (multi-step form, driven by AppStep + getVisibleSteps())
   ── USER_TYPE  ── SECTIONS   ── TARGET_JOB    ── PERSONAL_INFO
   ── EXPERIENCE ── PROJECTS   ── EDUCATION     ── SKILLS
   ── EXTRACURRICULARS ── AWARDS ── CERTIFICATIONS ── AFFILIATIONS ── PUBLICATIONS
   ── LANGUAGES ── REFERENCES   (BD-aware additions; toggle in SECTIONS step)

 Final step → handleGenerate() → resumeService.optimizeResume(data):
   0. assertContentIsReal(data) — pre-flight gibberish gate. Scans long free-form fields (job
      description, summary, experience/project/extracurricular brain-dumps). Throws
      GibberishContentError naming the offending field if any look like keyboard mashing.
      Bengali script + romanized Banglish (`ami`, `naam`, `bhalo`, ...) pass via the
      dictionary rescue layer in `application/validation/`. Goal: never spend AI tokens
      on `"asdfdsjurbgnasdkjn"`.
   1. Promise.allSettled([
        optimizeUseCase.execute(data),                       — tailors resume
        toolkitUseCase.execute(data),                        — one call for CL + outreach + LinkedIn + Qs
      ])                                                     — 2 Gemini calls total (RPM budget)
   2. Optimizer failure → throws (core artifact).
      Toolkit failure → records same friendly error under all 4 toolkit keys so the user can retry
      any one individually (per-item retry uses the single-artifact generators).
   3. Return OptimizedResumeData with { coverLetter, toolkit }

 BuilderScreen merges the optimized data, autosaves to Supabase (generated_resumes), routes to PREVIEW step.

 Preview
   ├── Sidebar groups: Documents (Resume templates + Cover Letter) │ Outreach (Email, LinkedIn) │ Interview (Q prep)
   ├── Main area: resume/CL = paginated A4-in-pt render (mirrors PDF exporter)
   │              outreach email / LinkedIn note / interview prep = ToolkitViewers w/ copy-to-clipboard
   └── Top bar: Download Word / Download PDF (document tabs only), Regenerate (General Resume only)
```

---

## 7. Key files (annotated)

```
index.html                              Tailwind config (brand/accent/charcoal palettes), fonts, <title>
metadata.json                           App name + description (used by platform)
package.json                            Name: "top-candidate"

src/index.tsx                           Vite entry → <App />
src/presentation/App.tsx                Auth + screen routing + initial data load + ResumeService boot
src/presentation/LandingScreen.tsx      Rebranded landing (Editorial Ink + Saffron, no gradients)
src/presentation/LoginScreen.tsx        Email/password auth
src/presentation/DashboardScreen.tsx    List of generated resumes + job applications
src/presentation/ProfileSetupScreen.tsx First-run profile capture
src/presentation/BuilderScreen.tsx      Multi-step form + generate handler + loading UI
src/presentation/components/Preview.tsx Resume/CL render + toolkit tabs sidebar
src/presentation/components/Builder/ToolkitViewers.tsx
                                        Outreach email, LinkedIn note, Interview prep (copy-to-clipboard)
src/presentation/components/FormSteps.tsx  All step forms (TargetJob, Experience, Projects, etc.)
src/presentation/templates/TemplateRegistry.ts  4 ATS-safe template definitions (all single-column)

src/application/services/ResumeService.ts   Orchestrator — call this from presentation
src/application/validation/                  Pre-flight content gates (run client-side before AI calls)
  ├── gibberishDetector.ts                   Refuses keyboard-mash before tokens are spent
  ├── dictionaries.ts                        English + tech + Banglish word sets (rescue layer)
  └── emailValidator.ts                      Signup gate: format + disposable + local-shape check

src/domain/entities/Resume.ts           Core types
src/domain/entities/AppStep.ts          Builder step enum
src/presentation/hooks/useBrowserNav.ts  Top-level screen routing + browser history (push/pop)
src/presentation/i18n/                  i18n infrastructure (en/bn locales, useT hook, LanguageToggle)
  ├── LocaleContext.tsx                  Provider + useT() hook + localStorage persistence
  ├── LanguageToggle.tsx                 Pill-style EN | বাং switch — used in nav/landing/login
  └── locales/{en,bn}.ts                 Typed dictionaries (TS enforces key parity)
src/domain/usecases/                    Use case classes + domain-layer interfaces (8 total)
src/domain/repositories/                Repo interfaces (IProfile, IResume, IApplication)

src/infrastructure/ai/                  AI providers (run server-side) + client proxies
  ├── MultiProviderResumeOptimizer.ts   Router — Groq → Gemini fallback w/ rate-class cooldown
  ├── GroqResumeOptimizer.ts            Primary optimizer (llama-3.3-70b-versatile)
  ├── GeminiResumeOptimizer.ts          Fallback optimizer (gemini-2.5-flash, schema-enforced)
  ├── prompts/resumeOptimizerPrompts.ts Shared system + user prompt + validation + post-filters
  ├── proxy/ProxyClients.ts             Client-side adapters that POST to /api/*
  └── Gemini{CoverLetter,Outreach,LinkedIn,InterviewQ,Toolkit,Extractor}Generator.ts (server-only)

api/                                    Vercel Functions — server-side AI proxy
  ├── optimize.ts                       POST — runs optimizer + toolkit (the 2-call hot path)
  ├── toolkit-item.ts                   POST — single-item regenerate
  ├── extract-resume.ts                 POST — PDF/Word extract (base64 + mimeType)
  └── _lib/                             auth.ts, rateLimit.ts, aiFactory.ts
src/infrastructure/auth/AuthContext.tsx Supabase Auth context/provider/hook
src/infrastructure/config/dependencies.ts  DI container — call createResumeService() for a wired service
src/infrastructure/export/              Word + PDF exporters (Composite pattern)
src/infrastructure/repositories/        Supabase repo implementations
src/infrastructure/supabase/client.ts   Supabase client singleton

supabase/schema.sql                     Fresh-DB bootstrap (reflects current state)
supabase/migrations/                    Incremental changes (run in SQL editor in order)

.agent/skills/                          Skill packages with opinion-rules (see §11)
```

---

## 8. Database (Supabase, Postgres + RLS)

All tables have RLS enabled; policies restrict rows to `auth.uid() = user_id`.

- `profiles` — user profile (linked 1:1 with `auth.users`), trigger `handle_new_user` auto-creates on signup
- `experiences`, `educations`, `projects`, `skills`, `extracurriculars`, `awards`, `certifications`, `affiliations`, `publications`, `languages`, `references_list` — profile sub-tables. **Note:** the `references` table is named `references_list` because `references` is a reserved keyword in Postgres.
- `applications` — legacy, partially unused (the current code persists generated output to `generated_resumes`)
- `generated_resumes` — final snapshots
  - `id`, `user_id`, `title`, `created_at`, `updated_at`
  - `data jsonb` — `ResumeData` minus toolkit
  - `toolkit jsonb` — `JobToolkit` (outreach email / LinkedIn note / interview questions)
- RPC `public.delete_user()` — deletes all user-owned rows then the auth user

**Migrations applied**
- `supabase/migrations/001_add_toolkit_column.sql` — adds `toolkit jsonb` + partial index on `generated_resumes`
- `supabase/migrations/002_add_languages_and_references.sql` — adds `languages` and `references_list` profile sub-tables with RLS
- `supabase/migrations/003_add_ai_call_log.sql` — adds `ai_call_log` table for per-user daily-cap rate limiting at the `/api/*` layer

**Running migrations**: open the Supabase SQL editor and paste the migration file contents. All migrations are idempotent (`add column if not exists`, `create index if not exists`).

---

## 9. External services

### AI providers

The resume optimizer is provider-agnostic — `MultiProviderResumeOptimizer` routes calls in this priority:

1. **Groq** — `llama-3.3-70b-versatile`, free tier 1,000 RPD / 30 RPM, ~5–8s latency. Configured via `VITE_GROQ_API_KEY`. OpenAI-compatible JSON mode (no schema enforcement → JSON shape spec embedded in user prompt + post-parse validation).
2. **Gemini** — `gemini-2.5-flash`, free tier 20 RPD on 2.5-flash, ~25–40s latency, **strongest schema enforcement** via `responseSchema`. Configured via `VITE_GEMINI_API_KEY`.

The router cools down a provider for 10 minutes when it returns 429/503/timeout, so a quota-exhausted Groq doesn't keep eating retries. If only one key is configured, the router uses just that one.

**Adding a third provider** (Cerebras, OpenRouter, etc.): implement `IResumeOptimizer`, reuse `prompts/resumeOptimizerPrompts.ts`, push into the `optimizerProviders` array in `dependencies.ts`. The shared prompt module is the contract — never hardcode rules inside an optimizer.

**Toolkit generators** (cover letter, outreach email, LinkedIn note, interview questions, resume extractor) are still Gemini-only. SDK: `@google/genai`. Free-tier RPM is the binding constraint. Initial generation = **2 calls only** (optimizer + combined `GeminiToolkitGenerator`). Do not re-fan the toolkit into N parallel calls.

`GeminiResumeOptimizer` has internal retry/timeout (45s, 3 attempts). `GroqResumeOptimizer` mirrors the same. The toolkit generator gets one extra `withRetry` shot from the service layer. Optimizer + toolkit are wrapped in `Promise.allSettled` so one failure doesn't kill the other.

### Supabase

- Auth: email/password (no OAuth configured)
- Row-level security is on for every table
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Client: `src/infrastructure/supabase/client.ts` (has a dev fallback so the app does not crash on missing env — it will fail at network time instead)

---

## 10. Brand & design

**Name:** TOP CANDIDATE (two-word wordmark: ink + saffron). No "R" badge, no square mark.

**Palette** (defined in `index.html` Tailwind config):
- `brand-*` — Editorial Ink (warm near-black, 700 = `#1A1812`). Primary text, buttons, ink.
- `accent-*` — Saffron Gold (400 = `#E59321`). Single accent — CTAs, highlights, active-state hints. Use sparingly (≤ 10% of pixels).
- `charcoal-*` — Stone (warm neutrals, 50 = `#FAFAF7`). Backgrounds, borders, muted text.

**Explicit constraints:**
- **No gradients** anywhere (search existing codebase if you think you need one — chances are you don't).
- **No blue, indigo, or purple** brand colors (generic AI look).
- No emojis in UI unless the user asked for them.

**Fonts** (Google Fonts, loaded in `index.html`):
- `Inter` — UI and body (default `font-sans`) — Latin script
- `Fraunces` — display headlines (`font-display`) — editorial serif, Latin
- `Merriweather` — resume template serif (`font-serif`) — don't change, used by PDF
- `Hind Siliguri` — Bengali UI/body. Stack swaps in via `html[data-locale="bn"] body`
- `Tiro Bangla` — Bengali display headlines. Stack swaps in via `html[data-locale="bn"] .font-display`

**Bengali rendering rule:** the resume document itself stays in English (so the rendered preview matches the PDF/Word exporter byte-for-byte and recruiters get the format they expect). Only UI chrome — navbar, dashboard, builder forms, preview tabs, toasts — translates. AI-generated content (resume bullets, cover letter, outreach, interview prep) stays in the language the user typed.

**UI idioms established:**
- Rounded cards: `rounded-2xl` (24px) for content, `rounded-full` for pill buttons
- Section eyebrows: `text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold`
- Dividers inside grouped cards: 1px `bg-charcoal-200` between cells (using the `gap-px` + bg-container trick)
- **Form wizards** (`ProfileSetupScreen`, `BuilderScreen`) use a sticky left
  phase rail on `lg+` (numbered phase groups: "About you" → "Your work" →
  "Your credentials"), collapsing to a progress bar on mobile. Active step
  marker is saffron, completed is ink, untouched is charcoal.
- **Form primitives** (defined in `components/FormSteps.tsx`, shared across
  profile setup and builder) — use these rather than reinventing:
  - `TipCard` — always-on "Quick guide" panel (saffron-tinted) above form
    fields. **Defaults to open** so users see guidance without a click; the
    user can collapse it. Rules + real examples. Used in steps where rules
    genuinely help (Education, Skills, Target Job, Extracurriculars).
  - `WritingGuide` — friendlier alternative to `TipCard` used at the top of
    the **brain-dump-heavy steps** (Experience, Projects). Leads with a
    *reassurance hero* ("write it however feels natural — the AI polishes
    it") instead of a rule list, with examples tucked behind a "Want a peek?"
    toggle. Use this whenever the section is open-ended writing, not
    structured fields.
  - `MiniGuide` — single-paragraph saffron callout for sparse credential
    steps (Awards, Certifications, Affiliations, Publications). Friendlier
    than a TipCard, just inline orientation. Renders an icon + one-line rule.
  - `PromptList` — numbered scaffolding shown above brain-dump textareas. 3
    small questions that turn "what should I write?" into 3 sub-answers.
  - `WritingChecklist` — live, transparent feedback under brain-dump
    textareas. 4 explicit checks (action verb / real number / outcome / 2–3
    sentences of detail) that flip filled as the user types. Pure regex,
    no AI call. Replaces the previous opaque 3-bar `QualityMeter`.
  - `PolishHint` — short "type messy, the AI will polish this" reassurance
    next to brain-dump fields, so users feel free to brain-dump.
  - `CollapsibleItem` — list-item cards (experience / projects / education /
    awards etc.) auto-collapse to a one-line summary once their key fields are
    filled. Click the header to re-expand.
  - `SectionHeader` — eyebrow + display title + subtitle for every step.

---

## 11. Skills / coding conventions

Skill packages live at `.agent/skills/` and are also mirrored to `~/.claude/skills/` so Claude Code's Skill tool can load them. Consult these when working in their domain:

- `composition-patterns` — React composition rules (compound components, avoid boolean props, React 19 no-forwardRef)
- `react-best-practices` — general React 19 + bundle + storage rules
- `web-design-guidelines` — general web design standards

**Project-level conventions** (enforced by the codebase, observe when editing):
- Clean Architecture layering (§4) is non-negotiable — infrastructure imports from domain, never vice versa
- New AI generator ⇒ domain interface + use case + Gemini impl + DI wire + orchestrator call, in that order
- All persistence goes through a repository interface, never a raw Supabase call from presentation/application
- Prefer `Promise.allSettled` for parallel independent AI calls so a single failure does not kill the flow
- `Preview.tsx` renders in pt (`PAGE_WIDTH_PT = 595.28`) to mirror the PDF exporter exactly — numeric sizes must stay in lockstep
- **All user-facing strings go through `useT()`** (`src/presentation/i18n/LocaleContext.tsx`). Never inline a literal in JSX or a `toast.*()` call. Add the key to `locales/en.ts` first, then `locales/bn.ts` — TypeScript enforces parity. Toggle is `<LanguageToggle />`, mounted in `Navbar`, `LandingScreen`, `LoginScreen`, `DashboardScreen` header, and `ProfileSetupScreen` top bar. Switching locale only mutates context — form state, current builder step, and scroll position are React state and survive a switch automatically.

---

## 12. Commands & env

```bash
npm install          # first time
npm run dev          # Vite dev server
npm run build        # typecheck (tsc is part of Vite) + production bundle
npm run preview      # serve the dist/ build
```

No test suite currently (no `npm test`). Verification = successful `npm run build` + manual browser pass.

**Required env vars** — split into client-visible (`VITE_*`) and server-only (no prefix). Set both in Vercel's Environment Variables UI; non-`VITE_` keys are NEVER bundled into the client:
```
# AI providers — server-only (used by Vercel Functions in /api/*)
GROQ_API_KEY             # https://console.groq.com/keys   (1,000 RPD free)
GEMINI_API_KEY           # https://aistudio.google.com/app/apikey  (20 RPD free)

# Supabase — client-visible (anon key is public-by-design, RLS-gated)
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

**Vercel deployment notes:**
- `vercel.json` sets `maxDuration: 60` for `api/**/*.ts` so optimizer calls (up to ~45s with retry) don't time out. On the Hobby tier 60s is the cap; consider Pro if you start chaining toolkit retries.
- `api/*` files use the standard `(req: VercelRequest, res: VercelResponse)` handler signature. They import freely from `src/` (Vercel's Node runtime resolves them via the same node_modules).
- Local dev: `vercel dev` is the canonical way to exercise `/api/*` routes; `npm run dev` only serves the Vite client (unauthenticated calls to `/api/*` return 404 in plain Vite).

---

## 13. Known debt / explicit non-goals

Agents: **do not build these unless the user asks.**

- **Mock-interview marketplace** — consultant profiles, booking, payments. Surfaced on the landing page but intentionally unbuilt. Separate product scope.
- **OAuth providers** — Supabase Auth is wired for email/password only.
- **Unit / integration tests** — no test harness exists. Don't invent one without asking.
- **General Resume toolkit generation** — the General Resume currently triggers the toolkit generators on a generic JD. Harmless but low-value. Consider short-circuiting for General Resume in a future pass.
- **Code-splitting** — the bundle is ~1.7MB. Vite warns about it; acceptable for now.
- **Legacy `applications` table** — exists in schema, unused by current code. Do not write to it; use `generated_resumes`.
- **Languages / References in ProfileSetupScreen and ProfileScreen** — currently only wired into the BuilderScreen flow (and loaded from the profile sub-tables when prefilling). To capture in the master profile too, add: state vars + step entries in `ProfileSetupScreen.tsx`, save cases in its switch, and tab + section component in `ProfileScreen.tsx` (mirror `PublicationSection`).
- **AI output in Bengali** — the UI translates (en/bn), but the AI-generated resume bullets, cover letter, outreach email, LinkedIn note, and interview Q&A still come back in English. Most BD recruiters expect English CVs, so this is intentional. Adding a per-document "Generate in: English / বাংলা" toggle would mean: branching prompts in `prompts/resumeOptimizerPrompts.ts` and each toolkit generator + a UI affordance + a prompt-language pass-through in the optimize flow. Don't ship without an explicit ask.
- **Locale persistence to Supabase** — locale is currently `localStorage`-only. Cross-device sync would need a `preferred_locale` column on `profiles` + a fetch on sign-in. Skipped for v1 because device-local is enough for a Bangladesh-first launch.

---

## 14. Update checklist (copy into your PR description)

```
[ ] AGENTS.md updated (product surface, architecture, data model, schema — whichever changed)
[ ] CLAUDE.md updated (if a new hard rule was introduced)
[ ] supabase/migrations/ — new file added, idempotent, schema.sql reflects it
[ ] No new gradient / generic blue / generic purple introduced
[ ] npm run build passes clean
[ ] No new test harness added without explicit ask
```
