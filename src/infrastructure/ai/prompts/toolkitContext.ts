// Shared candidate-context builder + post-generation guards used by every
// toolkit generator (combined GeminiToolkitGenerator + the four
// single-artifact generators that handle per-item retries).
//
// Why centralize:
// 1. Authenticity — every generator now sees the FULL candidate profile
//    (certifications, awards, languages, education, extracurriculars,
//    publications) instead of just experience + projects + skills. Toolkit
//    output should anchor in real candidate evidence, not generic JD-shaped
//    filler.
// 2. Reframing — candidate evidence is presented FIRST as the source of
//    truth; the JD is presented SECOND as a filter and ordering signal.
//    This priming alone meaningfully reduces "JD-shaped generic" outputs.
// 3. Voice signature — a short excerpt of the candidate's own raw bullet
//    text is passed as TONE-ONLY reference (explicitly NOT a fact source)
//    so generated copy sounds more like the candidate and less like a
//    flattened Gemini voice.
// 4. Deterministic guards — three post-generation checks that throw when
//    triggered, so the service-layer withRetry retries the call:
//      • assertNoFabricatedTools — high-signal tech tokens that appear in
//        output must also exist in the candidate's evidence corpus.
//      • assertOutreachSpecificity — outreach + LinkedIn output must
//        reference both the target company and the candidate's own work
//        (proper noun) — not just generic JD language.
//      • assertInterviewAnchor — interview answerStrategy text must point
//        to a real candidate proper noun (company / role / project /
//        certification / school) instead of vague "your relevant experience".

import { ResumeData } from '../../../domain/entities/Resume.js';

// ────────────────────────────────────────────────────────────────────
// 🧱 CANDIDATE CONTEXT
// ────────────────────────────────────────────────────────────────────
//
// One block, every section the candidate filled out, in a stable order. The
// generator prompts paste this verbatim under a "═ CANDIDATE EVIDENCE ═"
// header and reference it in their rule lists ("draw only from the
// candidate evidence above").
//
// Voice excerpt — first ~250 chars of each rawDescription, marked
// "(raw, for tone reference only)". Lets the model mimic the candidate's
// natural framing without lifting facts. Purely additive to the polished
// refinedBullets.

export interface CandidateContextOptions {
  /** Include the voice-reference excerpt block. Default true. */
  includeVoiceSignature?: boolean;
  /** Hard-cap each rawDescription excerpt at this many characters. */
  voiceExcerptChars?: number;
}

export function buildCandidateContext(
  data: ResumeData,
  opts: CandidateContextOptions = {}
): string {
  const includeVoice = opts.includeVoiceSignature !== false;
  const voiceCap = opts.voiceExcerptChars ?? 250;

  const lines: string[] = [];
  lines.push(`Name: ${data.personalInfo.fullName || '(not provided)'}`);
  lines.push(`Type: ${data.userType === 'student' ? 'Student / Entry-level' : 'Experienced Professional'}`);
  if (data.summary) lines.push(`Summary: ${data.summary}`);

  if (data.experience.length > 0) {
    lines.push('');
    lines.push('Work experience:');
    for (const e of data.experience) {
      const bullets = (e.refinedBullets && e.refinedBullets.length > 0)
        ? e.refinedBullets
        : e.rawDescription
          ? [e.rawDescription]
          : [];
      const tenure = e.startDate
        ? ` (${e.startDate} – ${e.isCurrent ? 'Present' : (e.endDate || 'present')})`
        : '';
      lines.push(`- ${e.role || 'Role'} at ${e.company || 'Company'}${tenure}`);
      for (const b of bullets) lines.push(`    • ${b}`);
    }
  }

  if (data.projects.length > 0) {
    lines.push('');
    lines.push('Projects:');
    for (const p of data.projects) {
      const bullets = (p.refinedBullets && p.refinedBullets.length > 0)
        ? p.refinedBullets
        : p.rawDescription
          ? [p.rawDescription]
          : [];
      const tech = p.technologies ? ` (${p.technologies})` : '';
      lines.push(`- ${p.name}${tech}`);
      for (const b of bullets) lines.push(`    • ${b}`);
    }
  }

  if (data.education.length > 0) {
    lines.push('');
    lines.push('Education:');
    for (const ed of data.education) {
      const field = ed.field ? ` in ${ed.field}` : '';
      const gpa = ed.gpa ? ` (GPA: ${ed.gpa})` : '';
      lines.push(`- ${ed.degree}${field} from ${ed.school}${gpa}`);
    }
  }

  if (data.certifications && data.certifications.length > 0) {
    lines.push('');
    lines.push('Certifications:');
    for (const c of data.certifications) {
      const issuer = c.issuer ? ` — ${c.issuer}` : '';
      const date = c.date ? ` (${c.date})` : '';
      lines.push(`- ${c.name}${issuer}${date}`);
    }
  }

  if (data.awards && data.awards.length > 0) {
    lines.push('');
    lines.push('Awards:');
    for (const a of data.awards) {
      const issuer = a.issuer ? ` — ${a.issuer}` : '';
      const date = a.date ? ` (${a.date})` : '';
      lines.push(`- ${a.title}${issuer}${date}${a.description ? `: ${a.description}` : ''}`);
    }
  }

  if (data.publications && data.publications.length > 0) {
    lines.push('');
    lines.push('Publications:');
    for (const p of data.publications) {
      const pub = p.publisher ? ` — ${p.publisher}` : '';
      const date = p.date ? ` (${p.date})` : '';
      lines.push(`- ${p.title}${pub}${date}`);
    }
  }

  if (data.extracurriculars && data.extracurriculars.length > 0) {
    lines.push('');
    lines.push('Extracurriculars:');
    for (const x of data.extracurriculars) {
      const tenure = x.startDate ? ` (${x.startDate} – ${x.endDate || 'present'})` : '';
      lines.push(`- ${x.title || 'Activity'} at ${x.organization || 'organization'}${tenure}`);
      const bullets = (x.refinedBullets && x.refinedBullets.length > 0)
        ? x.refinedBullets
        : x.description
          ? [x.description]
          : [];
      for (const b of bullets) lines.push(`    • ${b}`);
    }
  }

  if (data.affiliations && data.affiliations.length > 0) {
    lines.push('');
    lines.push('Affiliations:');
    for (const a of data.affiliations) {
      lines.push(`- ${a.role} at ${a.organization}`);
    }
  }

  if (data.languages && data.languages.length > 0) {
    lines.push('');
    lines.push('Languages: ' + data.languages
      .filter(l => l.name)
      .map(l => `${l.name} (${l.proficiency})`)
      .join(', '));
  }

  lines.push('');
  lines.push(`Skills: ${data.skills.join(', ') || '(none provided)'}`);

  if (data.skillCategories && data.skillCategories.length > 0) {
    lines.push('Skill groupings:');
    for (const cat of data.skillCategories) {
      lines.push(`  - ${cat.category}: ${cat.items.join(', ')}`);
    }
  }

  if (includeVoice) {
    const voiceParts: string[] = [];
    for (const e of data.experience) {
      if (!e.rawDescription) continue;
      const excerpt = e.rawDescription.trim().slice(0, voiceCap);
      if (!excerpt) continue;
      voiceParts.push(`@ ${e.role || 'role'} / ${e.company || 'company'}: ${excerpt}`);
    }
    for (const p of data.projects) {
      if (!p.rawDescription) continue;
      const excerpt = p.rawDescription.trim().slice(0, voiceCap);
      if (!excerpt) continue;
      voiceParts.push(`@ project ${p.name}: ${excerpt}`);
    }
    if (voiceParts.length > 0) {
      lines.push('');
      lines.push('VOICE REFERENCE — the candidate\'s own raw words. Use ONLY for tone and framing; do NOT lift facts that are not also in the polished bullets above:');
      for (const v of voiceParts.slice(0, 4)) {
        lines.push(`  > ${v}`);
      }
    }
  }

  return lines.join('\n');
}

// ────────────────────────────────────────────────────────────────────
// 🪪 EVIDENCE CORPUS
// ────────────────────────────────────────────────────────────────────
//
// One lowercased blob with everything the candidate said about themselves.
// Used by the fabrication guard to confirm a tech token mentioned in
// generator output is actually something the candidate evidenced.

export function buildToolkitEvidenceCorpus(data: ResumeData): string {
  const parts: string[] = [...(data.skills ?? [])];
  if (data.skillCategories) {
    for (const cat of data.skillCategories) {
      parts.push(cat.category);
      parts.push(...(cat.items ?? []));
    }
  }
  for (const e of data.experience ?? []) {
    parts.push(e.role ?? '', e.company ?? '', e.rawDescription ?? '');
    if (e.refinedBullets) parts.push(...e.refinedBullets);
  }
  for (const p of data.projects ?? []) {
    parts.push(p.name ?? '', p.rawDescription ?? '', p.technologies ?? '');
    if (p.refinedBullets) parts.push(...p.refinedBullets);
  }
  for (const ed of data.education ?? []) {
    parts.push(ed.school ?? '', ed.degree ?? '', ed.field ?? '');
  }
  for (const c of data.certifications ?? []) parts.push(c.name ?? '', c.issuer ?? '');
  for (const a of data.awards ?? []) parts.push(a.title ?? '', a.issuer ?? '', a.description ?? '');
  for (const p of data.publications ?? []) parts.push(p.title ?? '', p.publisher ?? '');
  for (const x of data.extracurriculars ?? []) {
    parts.push(x.title ?? '', x.organization ?? '', x.description ?? '');
    if (x.refinedBullets) parts.push(...x.refinedBullets);
  }
  for (const af of data.affiliations ?? []) parts.push(af.role ?? '', af.organization ?? '');
  for (const lang of data.languages ?? []) parts.push(lang.name ?? '');
  if (data.summary) parts.push(data.summary);
  return parts.join(' ').toLowerCase();
}

// ────────────────────────────────────────────────────────────────────
// 🎯 PROPER-NOUN HOOKS
// ────────────────────────────────────────────────────────────────────
//
// All the candidate's own proper-noun anchors — used to test whether output
// is actually grounded in the candidate's experience instead of being
// generic JD-shaped filler. Filtered for length so we don't trigger on
// 1–2 char artifacts.

export function buildCandidateAnchors(data: ResumeData): string[] {
  const anchors: string[] = [];
  for (const e of data.experience ?? []) {
    if (e.company && e.company.trim().length >= 3) anchors.push(e.company.trim());
    if (e.role && e.role.trim().length >= 3) anchors.push(e.role.trim());
  }
  for (const p of data.projects ?? []) {
    if (p.name && p.name.trim().length >= 3) anchors.push(p.name.trim());
  }
  for (const c of data.certifications ?? []) {
    if (c.name && c.name.trim().length >= 3) anchors.push(c.name.trim());
  }
  for (const a of data.awards ?? []) {
    if (a.title && a.title.trim().length >= 3) anchors.push(a.title.trim());
  }
  for (const ed of data.education ?? []) {
    if (ed.school && ed.school.trim().length >= 3) anchors.push(ed.school.trim());
  }
  for (const x of data.extracurriculars ?? []) {
    if (x.organization && x.organization.trim().length >= 3) anchors.push(x.organization.trim());
  }
  return anchors;
}

// ────────────────────────────────────────────────────────────────────
// 🛡 FABRICATION GUARD — TECH TOKENS
// ────────────────────────────────────────────────────────────────────
//
// Curated dictionary of high-signal tech / product / company tokens that
// resume readers expect to be backed by evidence. If a generator's output
// mentions any of these tokens AND the candidate's evidence corpus does
// not contain it, that is fabrication. Triggers a retry.
//
// The dictionary is intentionally NOT exhaustive — false negatives (rare
// tools the model invents) are acceptable. The goal is to catch the
// common, embarrassing case: model adds "AWS" or "Stripe" to make the
// candidate sound more impressive than their actual data supports.
//
// Tokens use the canonical casing recruiters expect; the matcher is case-
// insensitive against output and against evidence.

const TECH_TOKENS: string[] = [
  // Cloud & infrastructure
  'AWS', 'Amazon Web Services', 'GCP', 'Google Cloud', 'Azure',
  'Cloudflare', 'Vercel', 'Netlify', 'Heroku', 'DigitalOcean', 'Linode',
  'Fly.io', 'Render', 'Railway',
  // Programming languages
  'Python', 'JavaScript', 'TypeScript', 'Java', 'Kotlin', 'Swift',
  'Objective-C', 'Go', 'Golang', 'Rust', 'C++', 'C#', 'Ruby', 'PHP',
  'Scala', 'Elixir', 'Erlang', 'Dart', 'R', 'MATLAB', 'Perl', 'Lua',
  // Web frameworks & libraries
  'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Remix',
  'Gatsby', 'Astro', 'SolidJS',
  'Express', 'FastAPI', 'Django', 'Flask', 'Spring', 'Spring Boot',
  'Rails', 'Ruby on Rails', 'Laravel', 'NestJS', 'AdonisJS', 'Phoenix',
  'Tailwind', 'Bootstrap', 'Material-UI', 'Chakra UI',
  // Mobile
  'iOS', 'Android', 'Flutter', 'React Native', 'SwiftUI', 'Jetpack Compose',
  'Xamarin', 'Ionic',
  // Databases
  'PostgreSQL', 'Postgres', 'MySQL', 'MariaDB', 'SQLite', 'Oracle DB',
  'MongoDB', 'Redis', 'Memcached', 'Cassandra', 'DynamoDB', 'CosmosDB',
  'Snowflake', 'BigQuery', 'Databricks', 'Redshift',
  'Elasticsearch', 'OpenSearch', 'Algolia', 'Pinecone', 'Weaviate',
  'Firestore', 'Supabase', 'PlanetScale', 'Neon',
  // DevOps / IaC / CI
  'Docker', 'Kubernetes', 'K8s', 'Terraform', 'Pulumi', 'Ansible',
  'Chef', 'Puppet', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI',
  'Travis CI', 'ArgoCD', 'Helm', 'Istio',
  // AI / ML
  'TensorFlow', 'PyTorch', 'JAX', 'Keras', 'scikit-learn', 'XGBoost',
  'OpenAI', 'Anthropic', 'Claude', 'ChatGPT', 'GPT-4', 'GPT-5',
  'Gemini', 'LangChain', 'LlamaIndex', 'Hugging Face',
  // Observability / SaaS infra
  'Datadog', 'Grafana', 'Prometheus', 'Splunk', 'Sentry', 'PagerDuty',
  'New Relic', 'Honeycomb', 'Lightstep',
  // Payments / comms / SaaS
  'Stripe', 'Plaid', 'Twilio', 'SendGrid', 'Mailchimp', 'Auth0',
  'Okta', 'Firebase', 'Algolia',
  // Big tech / common fabrication targets
  'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Facebook',
  'Netflix', 'Tesla', 'Uber', 'Airbnb', 'Lyft', 'Spotify',
  'Salesforce', 'Adobe', 'Oracle', 'IBM', 'Intel', 'NVIDIA',
  'Shopify', 'Square', 'Block',
  // Methodologies (fabrication is rarer here, but keep flagged)
  'Scrum', 'Kanban', 'TDD', 'BDD',
];

export class ToolkitFabricationError extends Error {
  constructor(public readonly tokens: string[]) {
    super(`Toolkit output contained fabricated tech tokens not in candidate evidence: ${tokens.join(', ')}`);
    this.name = 'ToolkitFabricationError';
  }
}

export class ToolkitSpecificityError extends Error {
  constructor(public readonly missing: string) {
    super(`Toolkit output failed specificity check: ${missing}`);
    this.name = 'ToolkitSpecificityError';
  }
}

// Tokens that look "tech-y" but are genuinely safe to mention without
// being in evidence — common methodology / generic terms the model uses
// to describe approaches. Keep this short; over-allowing weakens the guard.
const FABRICATION_SAFELIST = new Set<string>([
  'agile', 'rest', 'sql', 'http', 'json', 'api', 'apis', 'frontend',
  'backend', 'fullstack', 'mobile', 'web', 'cloud',
]);

// Look for each TECH_TOKEN as a whole-word, case-insensitive match in the
// generator's output. For any hit, confirm the same token (or a known
// alias) appears in evidence. Aliases handle the AWS/Amazon Web Services
// pair, plus a few JS/TS-style abbreviations.
const TECH_TOKEN_ALIASES: Record<string, string[]> = {
  'aws': ['amazon web services'],
  'amazon web services': ['aws'],
  'gcp': ['google cloud', 'google cloud platform'],
  'google cloud': ['gcp', 'google cloud platform'],
  'k8s': ['kubernetes'],
  'kubernetes': ['k8s'],
  'postgres': ['postgresql'],
  'postgresql': ['postgres'],
  'golang': ['go'],
  'rails': ['ruby on rails'],
  'ruby on rails': ['rails'],
  'gpt-4': ['openai', 'chatgpt'],
  'gpt-5': ['openai', 'chatgpt'],
  'chatgpt': ['openai'],
};

export function detectFabricatedTokens(output: string, evidence: string): string[] {
  const lcOutput = ` ${output.toLowerCase()} `;
  const lcEvidence = evidence; // already lowercased
  const fabricated: string[] = [];
  const seen = new Set<string>();

  for (const token of TECH_TOKENS) {
    const lcToken = token.toLowerCase();
    if (FABRICATION_SAFELIST.has(lcToken)) continue;
    if (seen.has(lcToken)) continue;

    const escaped = lcToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundary = /^[a-z0-9]/.test(lcToken) ? '\\b' : '';
    const re = new RegExp(`${wordBoundary}${escaped}${/[a-z0-9]$/.test(lcToken) ? '\\b' : ''}`, 'i');
    if (!re.test(lcOutput)) continue;

    seen.add(lcToken);
    if (lcEvidence.includes(lcToken)) continue;
    const aliases = TECH_TOKEN_ALIASES[lcToken] ?? [];
    if (aliases.some(a => lcEvidence.includes(a))) continue;

    fabricated.push(token);
  }
  return fabricated;
}

export function assertNoFabricatedTools(output: string, data: ResumeData): void {
  const evidence = buildToolkitEvidenceCorpus(data);
  // Always allow the target company name in output even if the candidate
  // never worked there — outreach to a target IS the whole point.
  const augmented = data.targetJob.company
    ? `${evidence} ${data.targetJob.company.toLowerCase()}`
    : evidence;
  const fabricated = detectFabricatedTokens(output, augmented);
  if (fabricated.length > 0) {
    throw new ToolkitFabricationError(fabricated);
  }
}

// ────────────────────────────────────────────────────────────────────
// 🎯 SPECIFICITY GUARD
// ────────────────────────────────────────────────────────────────────
//
// Catches generic outreach / LinkedIn output. Two checks:
//   1. The text references the target company (or, if no company name was
//      provided in the JD, accepts any candidate anchor as proof of
//      grounding).
//   2. The text references at least one candidate proper-noun anchor
//      (their own company / role / project / certification / award /
//      school / extracurricular).
//
// `mode = 'either'` is used for LinkedIn notes — 280 chars rarely fits
// both; we accept either. `mode = 'both'` for outreach emails which have
// 110–170 words to play with.

export function assertOutreachSpecificity(
  output: string,
  data: ResumeData,
  mode: 'both' | 'either' = 'both'
): void {
  const lc = output.toLowerCase();
  const company = data.targetJob.company?.trim();
  const anchors = buildCandidateAnchors(data);

  const hasCompany = !!company && lc.includes(company.toLowerCase());
  const hasAnchor = anchors.some(a => lc.includes(a.toLowerCase()));

  if (mode === 'both') {
    if (!hasCompany && !!company) {
      throw new ToolkitSpecificityError(`output never names target company "${company}"`);
    }
    if (anchors.length > 0 && !hasAnchor) {
      throw new ToolkitSpecificityError('output never references a candidate proper noun (company / role / project / cert / school)');
    }
  } else {
    const ok = (hasCompany || !company) && (hasAnchor || anchors.length === 0);
    const okEither = hasCompany || hasAnchor || (!company && anchors.length === 0);
    if (!okEither && !ok) {
      throw new ToolkitSpecificityError('output is generic — no target company OR candidate anchor present');
    }
  }
}

// ────────────────────────────────────────────────────────────────────
// 🪝 INTERVIEW ANSWER-STRATEGY ANCHOR
// ────────────────────────────────────────────────────────────────────
//
// Each interview question's answerStrategy must reference at least one
// candidate proper-noun anchor — otherwise it's a generic prep sheet
// pretending to be tailored. We're lenient: only require half the
// questions to be properly anchored before throwing, since not every
// question type maps to a specific item (e.g. broad behavioral).

export function countAnchoredStrategies(
  strategies: string[],
  data: ResumeData
): number {
  const anchors = buildCandidateAnchors(data);
  if (anchors.length === 0) return strategies.length; // can't enforce
  let count = 0;
  for (const s of strategies) {
    const lc = s.toLowerCase();
    if (anchors.some(a => lc.includes(a.toLowerCase()))) count++;
  }
  return count;
}

export function assertInterviewAnchorCoverage(
  strategies: string[],
  data: ResumeData
): void {
  if (strategies.length === 0) return;
  const anchored = countAnchoredStrategies(strategies, data);
  // Require at least half to anchor in a candidate proper noun.
  if (anchored * 2 < strategies.length) {
    throw new ToolkitSpecificityError(
      `interview answerStrategies are mostly generic — only ${anchored}/${strategies.length} reference a candidate proper noun`
    );
  }
}
