// Infrastructure - Production-Grade Gemini AI Implementation

import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ResumeData, OptimizedResumeData } from '../../domain/entities/Resume';
import { IResumeOptimizer } from '../../domain/usecases/OptimizeResumeUseCase';

export class GeminiResumeOptimizer implements IResumeOptimizer {
  private readonly genAI: GoogleGenAI;
  private readonly model = 'gemini-2.5-flash';
  private readonly maxRetries = 3;
  private readonly timeoutMs = 20000; // 20s timeout
  private readonly temperature = 0.3; // Deterministic behavior

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async optimize(data: ResumeData): Promise<OptimizedResumeData> {
    const schema = this.buildSchema(data);
    const prompt = this.buildPrompt(data);
    const systemInstruction = this.buildSystemInstruction();

    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        const result = await this.withTimeout(
          this.genAI.models.generateContent({
            model: this.model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: schema,
              temperature: this.temperature,
              systemInstruction,
            },
          })
        );

        const responseText = this.extractText(result);
        const parsed = this.safeJsonParse(responseText);

        this.normalizeSkills(parsed);
        this.validateResponse(data, parsed);

        return parsed;
      } catch (error) {
        attempt++;
        console.warn(`Gemini optimization attempt ${attempt} failed:`, error);

        if (attempt >= this.maxRetries) {
          throw this.buildFinalError(error);
        }

        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw new Error('Unexpected optimization failure');
  }

  // ================================
  // 🔐 SYSTEM PROMPT
  // ================================

  private buildSystemInstruction(): string {
    return `
You are a senior ATS-optimization resume writer operating in STRUCTURED JSON MODE.
Your output will be parsed by Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo, iCIMS).

═══════════════════════════════════════════════
OUTPUT FORMAT (ABSOLUTE)
═══════════════════════════════════════════════
- Return ONLY valid JSON. No markdown. No code fences. No comments. No prose.
- Match the response schema EXACTLY.
- Preserve every input ID verbatim.
- Every input item MUST appear in the output with a non-empty refinedBullets array.

═══════════════════════════════════════════════
ATS CORE PRINCIPLES (non-negotiable)
═══════════════════════════════════════════════
1. KEYWORD MIRRORING — The job description is your keyword source of truth.
   - Identify hard skills, tools, frameworks, methodologies, certifications, and domain terms in the JD.
   - Use those exact terms verbatim (including casing: "JavaScript" not "javascript", "Node.js" not "nodejs").
   - Prefer the JD's phrasing over synonyms (if JD says "CI/CD pipelines", do not write "automated deployment workflows").
   - Do NOT keyword-stuff: weave keywords naturally into accurate statements about the candidate's real work.

2. HONESTY — Zero fabrication.
   - Never invent metrics, percentages, dollar amounts, team sizes, durations, tools, or outcomes.
   - If the candidate's raw text contains a number (e.g. "led 5 engineers", "reduced latency 40%"), PRESERVE it exactly.
   - If no metric exists, write a qualitative impact statement — do NOT make one up.
   - Do not claim skills or experience the candidate did not indicate.

3. BULLET FORMULA — Each bullet follows: [Strong Action Verb] + [Task/Scope] + [Method/Tools, if any] + [Result/Impact].
   - Start every bullet with a past-tense action verb (present tense for current role).
   - Never start with "Responsible for", "Worked on", "Helped with", "Duties included", or "I ".
   - Keep to 1–2 lines (roughly 14–26 words). No run-on sentences.
   - Quantify when the raw description supports it; otherwise use concrete qualitative impact.
   - Diversify opening verbs across bullets within the same item — no verb repeated twice in one block.
   - INDUSTRY-AWARE VERB BANKS — pick verbs that fit the candidate's actual field. Do NOT force tech verbs onto non-tech work.
     * Tech / engineering: Architected, Built, Developed, Engineered, Implemented, Launched, Shipped, Deployed, Refactored, Automated.
     * Healthcare / clinical: Treated, Assessed, Triaged, Administered, Coordinated, Educated, Counseled, Documented, Monitored.
     * Education / teaching: Designed, Taught, Mentored, Assessed, Differentiated, Facilitated, Coached, Tutored, Developed.
     * Business / sales / marketing: Closed, Negotiated, Generated, Pitched, Forecasted, Launched, Grew, Captured, Acquired, Onboarded.
     * Finance / accounting: Reconciled, Audited, Forecasted, Modeled, Analyzed, Reported, Reduced (cost), Recovered, Streamlined.
     * Legal: Drafted, Negotiated, Litigated, Researched, Filed, Advised, Represented, Reviewed.
     * Creative / design: Designed, Conceptualized, Illustrated, Branded, Storyboarded, Produced, Curated.
     * Operations / management: Led, Directed, Coordinated, Streamlined, Scaled, Restructured, Oversaw, Implemented.
     * Research / science: Investigated, Analyzed, Synthesized, Published, Presented, Hypothesized, Modeled.
     * Universal: Delivered, Drove, Championed, Owned, Improved, Reduced, Increased, Established.

4. SKILLS NORMALIZATION — Output a clean, ATS-parseable skill list.
   - Dedupe case-insensitively.
   - Use canonical forms: "JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "Kubernetes", "CI/CD", "REST API", "GraphQL".
   - Order: put JD-matched skills FIRST, then the candidate's remaining core skills.
   - Do NOT add skills the candidate never referenced. You may promote skills that clearly appear in experience/projects to the skills list.
   - Keep each entry short (1–3 words). No parentheses, no "X years of Y".

5. SUMMARY FORMAT — 3–4 sentences, no first-person pronouns, ATS-dense.
   - Sentence 1: Professional identity — [Role title] with [X years / recent graduate in field] specializing in [2–3 JD-aligned focus areas]. Use the candidate's ACTUAL field (nurse, teacher, marketer, engineer, attorney, designer, etc.) — don't force a tech framing.
   - Sentence 2: Signature strengths / top achievement (use a real metric if present, otherwise qualitative).
   - Sentence 3: Domain, stack, methodology, or credential fluency that mirrors JD keywords. For non-tech roles, lean on certifications, methodologies, populations served, or industry verticals — not software stacks.
   - Optional sentence 4: Alignment statement ("Seeking to apply [X] to [target role responsibility]").
   - For students / entry-level: lead with degree + field + graduation year, then projects/coursework/clinical-rotations/student-teaching/internships, then JD-aligned skills.

6. PROJECTS — Integrate listed tools/methods/technologies into the bullets where plausible.
   - The "technologies" field is a free-text "tools, methods, or technologies" capture. It may list software (React, Figma), methods (qualitative interviews, IEP planning), media (oil paint, video), or be EMPTY.
   - If empty, write the bullets WITHOUT inventing tools. Focus on action, scope, and outcome.
   - If populated, surface those exact terms naturally inside bullets where the work plausibly used them.

7. BULLET COUNT — Adapt to signal density:
   - Rich raw description (3+ distinct accomplishments) → 4–5 bullets.
   - Moderate description → 3–4 bullets.
   - Thin description → 2–3 bullets (quality over padding; never fabricate extra bullets).

═══════════════════════════════════════════════
PRE-RETURN SELF-CHECK (run mentally before emitting JSON)
═══════════════════════════════════════════════
- JSON parses and matches schema.
- Every input ID is present exactly once.
- No empty refinedBullets.
- No fabricated numbers, tools, or credentials.
- Every bullet starts with an action verb (no "Responsible for", no "Helped").
- JD's top hard-skill keywords appear across summary / skills / bullets where the candidate's background supports it.
- No duplicate starting verbs within a single experience/project item.
`;
  }

  // ================================
  // 📐 RESPONSE SCHEMA
  // ================================

  private buildSchema(data: ResumeData): Schema {
    const required: string[] = ['summary', 'skills'];

    // Dynamically require arrays that have input data so the AI never skips them
    if (data.experience.length > 0) required.push('experience');
    if (data.projects.length > 0) required.push('projects');
    if (data.extracurriculars && data.extracurriculars.length > 0) required.push('extracurriculars');

    return {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        skills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        experience: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              refinedBullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['id', 'refinedBullets'],
          },
        },
        projects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              refinedBullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['id', 'refinedBullets'],
          },
        },
        extracurriculars: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              refinedBullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['id', 'refinedBullets'],
          },
        },
      },
      required,
    };
  }

  // ================================
  // 🧠 PROMPT BUILDER
  // ================================

  private buildPrompt(data: ResumeData): string {
    const totalExperience = this.calculateTotalExperience(data.experience);
    const isStudent = data.userType === 'student';

    // Strip refinedBullets from data sent to AI to avoid confusion
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

    return `
═══════════════════════════════════════════════
TARGET JOB (keyword source of truth)
═══════════════════════════════════════════════
Title: ${data.targetJob.title || 'N/A'}
Company: ${data.targetJob.company || 'N/A'}
Description:
${data.targetJob.description}

STEP 0 — Mentally extract from the JD (do NOT output this list):
  • Hard skills & tools (languages, frameworks, platforms, databases).
  • Methodologies & processes (Agile, CI/CD, TDD, SRE, etc.).
  • Domain terms (fintech, healthcare, B2B SaaS, etc.).
  • Seniority / scope signals (ownership, cross-functional, mentorship).
Use the exact casing and phrasing from the JD when those terms genuinely apply to this candidate.

═══════════════════════════════════════════════
CANDIDATE CONTEXT
═══════════════════════════════════════════════
Type: ${isStudent ? 'Student / Entry-level' : 'Experienced Professional'}
Total work experience: ${totalExperience}

EXPERIENCE (${cleanExperience.length} items — each MUST produce refinedBullets):
${JSON.stringify(cleanExperience, null, 2)}

PROJECTS (${cleanProjects.length} items — each MUST produce refinedBullets):
${JSON.stringify(cleanProjects, null, 2)}

EXTRACURRICULARS (${cleanExtracurriculars.length} items — each MUST produce refinedBullets):
${JSON.stringify(cleanExtracurriculars, null, 2)}

EDUCATION:
${JSON.stringify(data.education, null, 2)}

CURRENT SKILLS (may be refined, reordered, deduped — do not fabricate additions):
${data.skills.join(', ') || '(none provided)'}

═══════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════
1. summary — Produce a 3–4 sentence ATS summary following the SUMMARY FORMAT in your system instructions. Mirror the JD's top 3–5 hard-skill keywords where the candidate's background supports them. No first-person pronouns.

2. skills — Return a clean, deduplicated, normalized list. JD-matched skills first (in JD's casing), then candidate's remaining core skills. Promote skills that clearly appear in experience/projects. Do not invent.

3. experience — For each entry, convert "description" into refinedBullets following the BULLET FORMULA.
   - Preserve exact numbers, percentages, team sizes, and dollar amounts from the raw description.
   - Weave in JD keywords only when truthful for this role.
   - Diversify opening verbs (no verb reused within one role's bullets).
   - Adapt count to signal density (2–5 bullets). Thin inputs → fewer, stronger bullets — never pad.

4. projects — Same bullet rules as experience. Integrate the listed "technologies" as keywords where the project work plausibly used them.

5. extracurriculars — Same bullet rules. Emphasize transferable skills (leadership, communication, organization) relevant to the JD.

═══════════════════════════════════════════════
HARD CONSTRAINTS
═══════════════════════════════════════════════
- Every input item's refinedBullets MUST be non-empty.
- Preserve all IDs exactly as given.
- Do NOT fabricate metrics, tools, credentials, or outcomes.
- Do NOT use "Responsible for", "Worked on", "Helped with", "Duties included", or first-person pronouns.
- Do NOT emit any text outside the JSON object.
`;
  }

  // ================================
  // 🛡 RESPONSE VALIDATION
  // ================================

  private validateResponse(
    input: ResumeData,
    output: OptimizedResumeData
  ) {
    if (!output.summary || !output.skills) {
      throw new Error('Missing required fields in AI response');
    }

    this.validateArrayCounts(
      input.experience,
      output.experience,
      'experience'
    );
    this.validateArrayCounts(
      input.projects,
      output.projects,
      'projects'
    );
    this.validateArrayCounts(
      input.extracurriculars,
      output.extracurriculars,
      'extracurriculars'
    );
  }

  private validateArrayCounts(
    inputArray: { id: string }[],
    outputArray: { id: string; refinedBullets: string[] }[] | undefined,
    field: string
  ) {
    if (!inputArray?.length) return;

    if (!outputArray || inputArray.length !== outputArray.length) {
      throw new Error(`AI did not return correct ${field} count`);
    }

    inputArray.forEach((item, index) => {
      const out = outputArray[index];

      if (!out || out.id !== item.id) {
        throw new Error(`ID mismatch in ${field}`);
      }

      if (!out.refinedBullets || out.refinedBullets.length === 0) {
        throw new Error(`Empty bullets in ${field} ${item.id}`);
      }
    });
  }

  // ================================
  // 🧹 SKILLS NORMALIZATION
  // ================================
  //
  // Safety net in case the AI returns duplicate casings ("React"/"react") or
  // surrounding whitespace. Preserves the first-seen casing (which reflects
  // the model's JD-ordered priority) while removing later case-only dupes.
  private normalizeSkills(parsed: OptimizedResumeData): void {
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

  // ================================
  // 🧮 EXPERIENCE CALCULATION
  // ================================

  private calculateTotalExperience(
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

      if (end.getDate() < start.getDate()) {
        months -= 1;
      }

      totalMonths += Math.max(0, months);
    });

    const years = Math.floor(totalMonths / 12);
    const remaining = totalMonths % 12;

    if (years === 0 && remaining === 0) return 'No Experience';

    return `${years ? `${years} year${years > 1 ? 's' : ''}` : ''} ${remaining ? `${remaining} month${remaining > 1 ? 's' : ''}` : ''
      }`.trim();
  }

  // ================================
  // 🛠 UTILITIES
  // ================================

  private extractText(result: any): string {
    const text =
      result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No valid text response from AI');
    }

    return text;
  }

  private safeJsonParse(text: string): OptimizedResumeData {
    try {
      return JSON.parse(text);
    } catch {
      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleaned);
    }
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), this.timeoutMs)
      ),
    ]);
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildFinalError(error: unknown): Error {
    if (error instanceof Error) {
      return new Error(`Resume optimization failed: ${error.message}`);
    }
    return new Error('Resume optimization failed due to unknown error');
  }
}