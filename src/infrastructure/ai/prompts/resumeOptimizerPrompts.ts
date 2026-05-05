// Shared prompt + validation logic for the resume optimizer.
//
// Used by GeminiResumeOptimizer (which passes a separate `responseSchema` to
// the Gemini SDK) and GroqResumeOptimizer (which embeds the JSON shape spec
// in the user prompt because OpenAI-compatible JSON mode does not enforce a
// schema). Keeping all prompt text + validation in one place ensures the two
// providers stay in lockstep on the rules — the rules are the product, not
// the SDK.

import { ResumeData, OptimizedResumeData } from '../../../domain/entities/Resume.js';

// ────────────────────────────────────────────────
// 🔐 SYSTEM INSTRUCTION
// ────────────────────────────────────────────────
//
// Slimmed from ~3K tokens to ~1.2K. Optimizing for free-tier TPM (Groq's
// 12K/min ceiling is the binding constraint). Removed: prose framing,
// industry-specific verb banks (model knows them), redundant pre-emit
// checklist (rules already cover it), repeated emphasis. Kept: every
// concrete rule that empirically changes output behavior.
export function buildSystemInstruction(): string {
  return `You are a senior ATS-optimization resume writer in JSON mode. Your output is parsed by ATS (Workday, Greenhouse, Lever, Taleo, iCIMS, BDJobs) and scanned by recruiters in <10 seconds.

OUTPUT: Valid JSON only. No markdown, code fences, comments, or prose. Match the schema exactly. Preserve every input ID verbatim. Every input item produces a non-empty refinedBullets array.

RULES:

1. KEYWORD MIRRORING — Use exact JD casing ("JavaScript", "Node.js", "Next.js"). Lift multi-word JD phrases verbatim where the candidate's work supports them ("design system", "distributed systems", "WCAG 2.2 AA", "Core Web Vitals", "Infrastructure as Code", "incident response", "on-call rotation", "feature flags", "stakeholder management"). ATS exact-match scoring penalizes synonyms.

2. ZERO FABRICATION — Never invent metrics, %, $, team sizes, durations, tools, or outcomes. Preserve every number from input verbatim. If no metric exists, write a qualitative impact statement.
   SKILL HONESTY: a skill may appear in 'skills' ONLY IF it is in the candidate's input skills, an experience description, a project description, or a project 'technologies' field. If the JD demands a tool the candidate never evidenced, DO NOT add it.
   Bullets: never name a tool unless the candidate evidenced it.

3. BULLETS — Start with a strong past-tense action verb (present for current role). Use Led, Owned, Drove, Architected, Built, Designed, Shipped, Launched, Deployed, Refactored, Migrated, Automated, Scaled, Reduced, Increased, Improved, Cut, Accelerated, Established, Standardized, Mentored, Resolved, Eliminated.
   Banned starts (instant reject): "Responsible for", "Worked on", "Helped with/to", "Duties included", "Tasked with", "In charge of", "Assisted with/in", "Involved in", "Participated in", first-person.
   Avoid weak openers (Assisted/Contributed/Utilized/Helped/Worked/Handled) — replace with strong verbs naming the concrete contribution.
   1–2 lines (~14–26 words). Diversify opening verbs within an item — never repeat a verb in the same role's bullets.

4. PER-JD BULLET ORDERING — The first bullet under the current role is the recruiter's highest-attention spot. Within each role/project, order bullets so the most JD-aligned achievement is FIRST. The same role can surface different lead bullets across different JD targets — that's the point. Reorder and rephrase only what the candidate actually did; never invent.

5. SKILLS — Clean, deduped (case-insensitive). JD-matched FIRST in JD casing, then remainder. Canonical forms ("CI/CD", "REST API", "PostgreSQL"). 1–3 words each, no soft skills.

6. SUMMARY — 3–4 sentences, no first-person pronouns.
   S1: Identity — [Role title / level] with [X years / recent grad in field] specializing in [2–3 JD-aligned focus areas, lifted from JD]. Use the candidate's actual field (nurse, teacher, marketer, attorney, designer, engineer, etc.) — don't force a tech framing.
   S2: Signature achievement — MUST contain a real number from the candidate's input.
   S3: Stack / methodology fluency mirroring 4–6 of the JD's hard-skill terms the candidate genuinely has.
   S4 (optional): Alignment statement.
   Students/entry-level: lead with degree + field + graduation year, then projects/coursework/internships.

7. PROJECTS — Integrate listed "technologies" naturally. If empty, no inventing.

8. BULLET COUNT — Match signal density: rich (3+ accomplishments) → 4–5 bullets, moderate → 3–4, thin → 2–3. Never pad.`;
}

// ────────────────────────────────────────────────
// 🧠 USER PROMPT
// ────────────────────────────────────────────────
//
// `embedSchemaSpec` controls whether to embed an explicit JSON shape spec in
// the prompt text. Gemini does NOT need this (it gets a `responseSchema`
// alongside the prompt), but OpenAI-compatible providers' JSON mode just
// guarantees valid JSON, not a particular shape — so the shape must live in
// the prompt for those.
export function buildUserPrompt(data: ResumeData, opts: { embedSchemaSpec: boolean } = { embedSchemaSpec: false }): string {
  const totalExperience = calculateTotalExperience(data.experience);
  const isStudent = data.userType === 'student';

  const cleanExperience = data.experience.map(e => ({
    id: e.id,
    company: e.company,
    role: e.role,
    startDate: e.startDate,
    endDate: e.endDate,
    isCurrent: e.isCurrent,
    description: e.rawDescription,
  }));

  const cleanProjects = data.projects.map(p => ({
    id: p.id,
    name: p.name,
    description: p.rawDescription,
    technologies: p.technologies,
    link: p.link,
  }));

  const cleanExtracurriculars = (data.extracurriculars || []).map(e => ({
    id: e.id,
    title: e.title,
    organization: e.organization,
    startDate: e.startDate,
    endDate: e.endDate,
    description: e.description,
  }));

  const schemaSpec = opts.embedSchemaSpec ? buildSchemaSpec(data) : '';

  // Compact JSON (no pretty-printing) saves ~25–30% of the candidate-data
  // tokens. Models read compact JSON just as well as indented JSON.
  return `TARGET JOB
Title: ${data.targetJob.title || 'N/A'}
Company: ${data.targetJob.company || 'N/A'}
Description:
${data.targetJob.description}

CANDIDATE
Type: ${isStudent ? 'Student / Entry-level' : 'Experienced Professional'}
Total experience: ${totalExperience}
Skills (input): ${data.skills.join(', ') || '(none)'}

EXPERIENCE (${cleanExperience.length} items — each MUST produce refinedBullets):
${JSON.stringify(cleanExperience)}

PROJECTS (${cleanProjects.length} items — each MUST produce refinedBullets):
${JSON.stringify(cleanProjects)}

EXTRACURRICULARS (${cleanExtracurriculars.length} items — each MUST produce refinedBullets):
${JSON.stringify(cleanExtracurriculars)}

EDUCATION:
${JSON.stringify(data.education)}

TASK
1. summary — Per the SUMMARY rule. S2 MUST contain a real number from input.
2. skills — JD-matched first (in JD casing), then candidate's. SKILL HONESTY: include only what the candidate evidenced. If you want to add a JD-required skill the candidate doesn't have, DO NOT.
3. experience — Convert each "description" into refinedBullets. Preserve every number. Reorder so the first bullet under each role is the most JD-aligned achievement. Strong verbs only.
4. projects — Same rules. Integrate "technologies" naturally.
5. extracurriculars — Same rules.${schemaSpec}`;
}

// Used only when the provider's JSON mode does not natively enforce a schema
// (Groq, Cerebras, OpenAI-compat). Gemini gets the schema via responseSchema.
function buildSchemaSpec(data: ResumeData): string {
  const expIds = data.experience.map(e => `"${e.id}"`).join(', ') || '(none)';
  const projIds = data.projects.map(p => `"${p.id}"`).join(', ') || '(none)';
  const extraIds = (data.extracurriculars || []).map(e => `"${e.id}"`).join(', ') || '(none)';

  return `
═══════════════════════════════════════════════
REQUIRED OUTPUT JSON SHAPE (return EXACTLY this shape)
═══════════════════════════════════════════════
{
  "summary": "string — 3–4 sentences",
  "skills": ["string", "string", ...],
  "experience": [
    { "id": "<input id>", "refinedBullets": ["string", ...] }
    // one entry per input experience, in input order; ids: ${expIds}
  ],
  "projects": [
    { "id": "<input id>", "refinedBullets": ["string", ...] }
    // ids: ${projIds}
  ],
  "extracurriculars": [
    { "id": "<input id>", "refinedBullets": ["string", ...] }
    // ids: ${extraIds}
  ]
}

ID PRESERVATION: every id above must appear EXACTLY once in the corresponding output array, in the same casing.
Empty arrays ARE allowed when there were zero input items in that section.`;
}

// ────────────────────────────────────────────────
// 🛡 RESPONSE VALIDATION
// ────────────────────────────────────────────────
export function validateOptimizedResponse(input: ResumeData, output: OptimizedResumeData): void {
  if (!output.summary || !output.skills) {
    throw new Error('Missing required fields in AI response');
  }
  validateArrayCounts(input.experience, output.experience, 'experience');
  validateArrayCounts(input.projects, output.projects, 'projects');
  validateArrayCounts(input.extracurriculars, output.extracurriculars, 'extracurriculars');
}

function validateArrayCounts(
  inputArray: { id: string }[] | undefined,
  outputArray: { id: string; refinedBullets: string[] }[] | undefined,
  field: string
): void {
  if (!inputArray?.length) return;

  if (!outputArray || inputArray.length !== outputArray.length) {
    throw new Error(`AI did not return correct ${field} count`);
  }

  inputArray.forEach((item, index) => {
    const out = outputArray[index];
    if (!out || out.id !== item.id) throw new Error(`ID mismatch in ${field}`);
    if (!out.refinedBullets || out.refinedBullets.length === 0) {
      throw new Error(`Empty bullets in ${field} ${item.id}`);
    }
  });
}

// ────────────────────────────────────────────────
// 🧹 SKILLS NORMALIZATION
// ────────────────────────────────────────────────
//
// Safety net in case the model returns duplicate casings ("React"/"react") or
// surrounding whitespace. Preserves first-seen casing (which reflects the
// model's JD-ordered priority) while removing later case-only duplicates.
export function normalizeSkills(parsed: OptimizedResumeData): void {
  if (!parsed?.skills || !Array.isArray(parsed.skills)) return;

  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const raw of parsed.skills) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(trimmed);
  }

  parsed.skills = deduped;
}

// ────────────────────────────────────────────────
// 🛡 SKILL FABRICATION FILTER
// ────────────────────────────────────────────────
//
// The system prompt forbids skill fabrication, but models — especially
// JD-eager ones — still slip in JD-required tools the candidate never
// evidenced. This is the most damaging failure mode: a recruiter who catches
// one fake skill rejects on the spot. So we strip programmatically as a
// belt-and-braces step, not just rely on the model.
//
// Evidence corpus = candidate's input skills + experience descriptions +
// project descriptions + project technologies + education fields +
// certification names. Substring match (lowercased). Keeps everything that
// appears in any of those; drops the rest.
export function filterFabricatedSkills(
  parsed: OptimizedResumeData,
  candidate: ResumeData
): { kept: string[]; fabricated: string[] } {
  const evidence = buildEvidenceText(candidate).toLowerCase();
  const kept: string[] = [];
  const fabricated: string[] = [];
  for (const skill of parsed.skills ?? []) {
    if (typeof skill !== 'string') continue;
    const trimmed = skill.trim();
    if (!trimmed) continue;
    if (skillEvidenced(trimmed, evidence)) kept.push(trimmed);
    else fabricated.push(trimmed);
  }
  parsed.skills = kept;
  return { kept, fabricated };
}

// Substring evidence check + a small set of well-known abbreviation pairs so
// "JavaScript" matches "JS" in the candidate's input (and vice-versa).
function skillEvidenced(skill: string, evidence: string): boolean {
  const lc = skill.toLowerCase();
  if (evidence.includes(lc)) return true;
  const expansions = SKILL_ALIASES[lc];
  if (expansions) {
    for (const alias of expansions) if (evidence.includes(alias)) return true;
  }
  return false;
}

const SKILL_ALIASES: Record<string, string[]> = {
  'javascript': ['js'],
  'js': ['javascript'],
  'typescript': ['ts'],
  'ts': ['typescript'],
  'kubernetes': ['k8s'],
  'k8s': ['kubernetes'],
  'postgresql': ['postgres', 'psql'],
  'postgres': ['postgresql'],
  'amazon web services': ['aws'],
  'aws': ['amazon web services'],
  'google cloud platform': ['gcp'],
  'gcp': ['google cloud platform'],
  'continuous integration': ['ci/cd', 'ci\\cd', 'cicd'],
  'ci/cd': ['continuous integration', 'continuous delivery'],
  'rest api': ['rest', 'restful'],
  'graphql': ['gql'],
  'react': ['reactjs', 'react.js'],
  'next.js': ['nextjs', 'next js'],
  'node.js': ['nodejs', 'node js'],
  'websockets': ['websocket'],
  'websocket': ['websockets'],
};

function buildEvidenceText(c: ResumeData): string {
  const parts: string[] = [...(c.skills ?? [])];
  for (const e of c.experience ?? []) parts.push(e.role ?? '', e.company ?? '', e.rawDescription ?? '');
  for (const p of c.projects ?? []) parts.push(p.name ?? '', p.rawDescription ?? '', p.technologies ?? '');
  for (const ed of c.education ?? []) parts.push(ed.school ?? '', ed.degree ?? '', ed.field ?? '');
  for (const cert of c.certifications ?? []) parts.push(cert.name ?? '', cert.issuer ?? '');
  return parts.join(' ');
}

// ────────────────────────────────────────────────
// 🎯 LEAD-BULLET REORDERING
// ────────────────────────────────────────────────
//
// Recruiters spend 80% of their scan on the FIRST bullet under the current
// role. The system prompt asks the model to reorder per-JD; in practice the
// model often picks the candidate's objectively-strongest single bullet
// (latency win, biggest number) regardless of JD fit. This post-step rescues
// the case: per role/project, score each bullet by JD-keyword density and
// promote the highest-scoring bullet to position 0. Rest stay in AI's order
// to preserve narrative flow.
//
// Conservative: only swaps the leader if a different bullet has a strictly
// higher score than the current one. Ties → keep AI's order.
export function reorderLeadBulletByJDFit(
  parsed: OptimizedResumeData,
  jdText: string
): void {
  const jdVocab = jdVocabulary(jdText);
  if (jdVocab.size === 0) return;

  for (const exp of parsed.experience ?? []) promoteLead(exp.refinedBullets, jdVocab);
  for (const proj of parsed.projects ?? []) promoteLead(proj.refinedBullets, jdVocab);
  for (const ex of parsed.extracurriculars ?? []) promoteLead(ex.refinedBullets, jdVocab);
}

function promoteLead(bullets: string[] | undefined, jdVocab: Set<string>): void {
  if (!bullets || bullets.length < 2) return;
  let bestIdx = 0;
  let bestScore = bulletScore(bullets[0], jdVocab);
  for (let i = 1; i < bullets.length; i++) {
    const score = bulletScore(bullets[i], jdVocab);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  if (bestIdx !== 0) {
    const winner = bullets.splice(bestIdx, 1)[0];
    bullets.unshift(winner);
  }
}

function bulletScore(bullet: string, jdVocab: Set<string>): number {
  const tokens = tokenizeForScoring(bullet);
  let score = 0;
  for (const t of tokens) if (jdVocab.has(t)) score++;
  return score;
}

function jdVocabulary(jdText: string): Set<string> {
  const vocab = new Set<string>();
  for (const t of tokenizeForScoring(jdText)) {
    if (t.length < 3) continue;
    if (STOPWORDS.has(t)) continue;
    vocab.add(t);
  }
  return vocab;
}

function tokenizeForScoring(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+./#-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'to', 'of', 'in', 'on', 'at', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'should', 'could', 'may', 'might', 'must', 'shall', 'can',
  'as', 'we', 'you', 'your', 'our', 'their', 'this', 'that', 'these', 'those',
  'it', 'its', 'they', 'them', 'i', 'me', 'my', 'us', 'who', 'what', 'where', 'when', 'why', 'how',
  'all', 'any', 'each', 'every', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'also', 'into', 'about', 'from', 'such', 'including', 'across',
  'will', 'work', 'role', 'team', 'teams', 'company',
]);

// ────────────────────────────────────────────────
// 🧮 EXPERIENCE TOTAL
// ────────────────────────────────────────────────
export function calculateTotalExperience(
  experience: { startDate: string; endDate: string; isCurrent: boolean }[]
): string {
  let totalMonths = 0;

  experience.forEach(exp => {
    const start = new Date(exp.startDate);
    const end = exp.isCurrent ? new Date() : new Date(exp.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (end.getDate() < start.getDate()) months -= 1;
    totalMonths += Math.max(0, months);
  });

  const years = Math.floor(totalMonths / 12);
  const remaining = totalMonths % 12;

  if (years === 0 && remaining === 0) return 'No Experience';

  return `${years ? `${years} year${years > 1 ? 's' : ''}` : ''} ${remaining ? `${remaining} month${remaining > 1 ? 's' : ''}` : ''
    }`.trim();
}

// ────────────────────────────────────────────────
// 🛠 PARSING / RUNTIME UTILITIES
// ────────────────────────────────────────────────
export function safeJsonParse<T = OptimizedResumeData>(text: string): T {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), ms)
    ),
  ]);
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
