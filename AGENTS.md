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
- **Google Gemini 2.5 Flash** (`@google/genai`) for all AI generation
- **Supabase** (`@supabase/supabase-js`) for auth + persistence
- **docx**, **jspdf**, **html2pdf.js** for export
- **Radix Popover**, **Lucide icons**, **Sonner** (toasts), **date-fns**
- Import map in `index.html` for CDN-loaded modules (lucide-react, @google/genai, docx, etc.) — build also bundles locally

No monorepo, no workspaces. Single Vite app.

---

## 3. Product surface (currently shipped)

| Area | File entry point | Status |
| --- | --- | --- |
| Landing page | `src/presentation/LandingScreen.tsx` | shipped — rebranded, no gradients, Saffron/Ink palette |
| Auth (email + password) | `src/presentation/LoginScreen.tsx`, `src/infrastructure/auth/AuthContext.tsx` | shipped (Supabase Auth) |
| Profile setup (master profile) | `src/presentation/ProfileSetupScreen.tsx` | shipped — one-time profile capture used to seed future resumes |
| Dashboard (hero + toolkit grid + consultant marketplace placeholder) | `src/presentation/DashboardScreen.tsx` | shipped |
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
 ┌──────────────────── Infrastructure ───────────────────────┐
 │  AI:       Gemini{ResumeOptimizer, CoverLetterGenerator,  │
 │            ResumeExtractor, OutreachEmailGenerator,       │
 │            LinkedInMessageGenerator,                      │
 │            InterviewQuestionsGenerator,                   │
 │            ToolkitGenerator (combined — hot path)}        │
 │  Export:   CompositeResumeExporter (Word + PDF)           │
 │  Auth:     AuthContext (Supabase Auth)                    │
 │  Persist:  Supabase{Profile,Resume,Application}Repository │
 │  Config:   dependencies.ts (DI container)                 │
 └───────────────────────────────────────────────────────────┘
```

**Rules:**
- **Domain** depends on nothing. Pure types and interfaces.
- **Application** depends on domain only.
- **Infrastructure** implements domain interfaces. Can import SDKs (Supabase, Gemini).
- **Presentation** depends on application + domain. Can read infrastructure via `dependencies.ts` but should prefer going through `ResumeService`.

**AI call budget:** initial generation runs exactly TWO concurrent Gemini calls — optimizer + combined toolkit (`GeminiToolkitGenerator`). Free-tier RPM is 5; historical 1-optimizer-plus-4-toolkit fan-out hit quota. Per-item regeneration still hits the single-artifact generators (one call per retry).

**Adding a new AI generator:** add an interface + use case in `domain/usecases/`, a Gemini implementation in `infrastructure/ai/`, wire it into `dependencies.ts`, inject into `ResumeService`. For single-item ancillary output, call it from `regenerateToolkitItem()` — NOT from `optimizeResume()`, which is restricted to the 2-call hot path. If you need to expand the initial toolkit, extend `GeminiToolkitGenerator`'s schema/prompt instead of adding a parallel call.

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

 Final step → handleGenerate() → resumeService.optimizeResume(data):
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

src/domain/entities/Resume.ts           Core types
src/domain/entities/AppStep.ts          Builder step enum
src/presentation/hooks/useBrowserNav.ts  Top-level screen routing + browser history (push/pop)
src/domain/usecases/                    Use case classes + domain-layer interfaces (8 total)
src/domain/repositories/                Repo interfaces (IProfile, IResume, IApplication)

src/infrastructure/ai/                  6 Gemini generators (one per AI artifact)
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
- `experiences`, `educations`, `projects`, `skills`, `extracurriculars`, `awards`, `certifications`, `affiliations`, `publications` — profile sub-tables
- `applications` — legacy, partially unused (the current code persists generated output to `generated_resumes`)
- `generated_resumes` — final snapshots
  - `id`, `user_id`, `title`, `created_at`, `updated_at`
  - `data jsonb` — `ResumeData` minus toolkit
  - `toolkit jsonb` — `JobToolkit` (outreach email / LinkedIn note / interview questions)
- RPC `public.delete_user()` — deletes all user-owned rows then the auth user

**Migrations applied**
- `supabase/migrations/001_add_toolkit_column.sql` — adds `toolkit jsonb` + partial index on `generated_resumes`

**Running migrations**: open the Supabase SQL editor and paste the migration file contents. All migrations are idempotent (`add column if not exists`, `create index if not exists`).

---

## 9. External services

### Gemini (AI)

- Model: `gemini-2.5-flash`
- SDK: `@google/genai`
- All generators share the pattern: system instruction + user prompt + (optional) `responseSchema` for JSON output
- Free-tier RPM is the binding constraint. Initial generation = **2 calls only** (optimizer + combined `GeminiToolkitGenerator`). Do not re-fan the toolkit into N parallel calls.
- `GeminiResumeOptimizer` has internal retry/timeout. The toolkit generator gets one extra `withRetry` shot from the service layer. Both are wrapped in `Promise.allSettled` so an optimizer failure vs toolkit failure are handled independently.

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
- `Inter` — UI and body (default `font-sans`)
- `Fraunces` — display headlines (`font-display`) — editorial serif
- `Merriweather` — resume template serif (`font-serif`) — don't change, used by PDF

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
  - `TipCard` — collapsible "How to write this" panel (saffron-tinted) for
    writing-heavy fields. Default closed. Rules + optional examples.
  - `QualityMeter` — pure heuristic (length + action verb + metric regex) under
    "brain dump" textareas. Three-bar saffron indicator + short hint. No AI call.
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

---

## 12. Commands & env

```bash
npm install          # first time
npm run dev          # Vite dev server
npm run build        # typecheck (tsc is part of Vite) + production bundle
npm run preview      # serve the dist/ build
```

No test suite currently (no `npm test`). Verification = successful `npm run build` + manual browser pass.

**Required env vars** (`.env`):
```
VITE_GEMINI_API_KEY      # https://aistudio.google.com/app/apikey
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_ANON_KEY   # Supabase anon key
```

---

## 13. Known debt / explicit non-goals

Agents: **do not build these unless the user asks.**

- **Mock-interview marketplace** — consultant profiles, booking, payments. Surfaced on the landing page but intentionally unbuilt. Separate product scope.
- **OAuth providers** — Supabase Auth is wired for email/password only.
- **Unit / integration tests** — no test harness exists. Don't invent one without asking.
- **i18n / l10n** — strings are all English, inline.
- **General Resume toolkit generation** — the General Resume currently triggers the toolkit generators on a generic JD. Harmless but low-value. Consider short-circuiting for General Resume in a future pass.
- **Code-splitting** — the bundle is ~1.7MB. Vite warns about it; acceptable for now.
- **Legacy `applications` table** — exists in schema, unused by current code. Do not write to it; use `generated_resumes`.

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
