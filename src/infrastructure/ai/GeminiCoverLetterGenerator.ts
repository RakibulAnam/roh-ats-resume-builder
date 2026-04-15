// Infrastructure - Gemini AI Cover Letter Generator

import { GoogleGenAI } from '@google/genai';
import { ResumeData } from '../../domain/entities/Resume';
import { ICoverLetterGenerator } from '../../domain/usecases/GenerateCoverLetterUseCase';

export class GeminiCoverLetterGenerator implements ICoverLetterGenerator {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generate(data: ResumeData): Promise<string> {
    const prompt = this.buildPrompt(data);

    try {
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.4,
          systemInstruction: `You are a senior cover-letter writer specializing in applications that pass BOTH ATS keyword screening AND human hiring-manager review.

SCOPE — You write ONLY the body paragraphs. The application renders the date, sender block, recipient block, "Dear Hiring Manager,", "Sincerely,", and signature separately. Do NOT include any of those.

FORMAT — Return 3–4 plain-text body paragraphs separated by a single blank line. No markdown, no bold, no bullets, no headings, no code fences.

LENGTH — 250–400 words total across all paragraphs. Tight, specific, confident. No filler.

TONE — Professional, direct, authentic. No clichés ("I am writing to express my interest", "team player", "think outside the box", "proven track record" as a standalone phrase). No hedging ("I believe I could maybe…"). No grandiosity.

ATS & KEYWORD DISCIPLINE — Mirror the job description's exact hard-skill and tool keywords verbatim (matching casing). Weave them naturally into truthful statements about the candidate. Never keyword-stuff; never invent experience.

HONESTY — Do not fabricate metrics, employers, outcomes, or credentials. Only use what the provided candidate data supports.`,
        },
      });

      const responseText = result.text;
      if (!responseText) {
        throw new Error('No response from AI');
      }

      return this.cleanResponse(responseText.trim(), data);
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      throw new Error(
        `Failed to generate cover letter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Strip any structural elements the AI may have included despite instructions.
   * Removes: date lines, address blocks, greetings, closings, signature blocks, markdown.
   */
  private cleanResponse(text: string, data: ResumeData): string {
    // Remove markdown formatting
    let cleaned = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^#{1,6}\s.*/gm, '')
      .replace(/```[\s\S]*?```/g, '');

    // Split into lines for filtering
    const lines = cleaned.split('\n');
    const filteredLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();

      // Skip empty lines (we'll re-add paragraph breaks later)
      if (!trimmed) {
        if (filteredLines.length > 0) filteredLines.push('');
        continue;
      }

      // Skip date-like lines (e.g. "April 2, 2026", "2026-04-02")
      if (/^\w+\s+\d{1,2},?\s+\d{4}$/.test(trimmed) || /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) continue;

      // Skip address-like lines (short lines before the body, city/state patterns)
      if (/^[\w\s]+,\s*[A-Z]{2}\s+\d{5}/.test(trimmed)) continue;

      // Skip greeting / salutation lines
      if (/^dear\s/i.test(trimmed)) continue;
      if (/^to whom it may concern/i.test(trimmed)) continue;

      // Skip closing lines
      if (/^(sincerely|best regards|regards|respectfully|warm regards|yours truly|yours faithfully),?$/i.test(trimmed)) continue;

      // Skip lines that are just a person's name at the end (after closing)
      if (lower === data.personalInfo.fullName.toLowerCase()) continue;

      // Skip contact info lines (email, phone, LinkedIn URLs)
      if (/^[\w.+-]+@[\w.-]+\.\w+$/.test(trimmed)) continue;
      if (/^\+?[\d\s()-]{7,}$/.test(trimmed)) continue;
      if (/^https?:\/\/(www\.)?(linkedin|github)\.com/i.test(trimmed)) continue;

      // Skip "Hiring Manager" standalone line
      if (lower === 'hiring manager') continue;

      // Skip company name standalone line (if it matches exactly)
      if (data.targetJob.company && trimmed === data.targetJob.company) continue;

      // Skip "Re:" or "Subject:" lines
      if (/^(re:|subject:)/i.test(trimmed)) continue;

      filteredLines.push(line);
    }

    // Join and collapse excessive blank lines into double newlines (paragraph breaks)
    return filteredLines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private buildPrompt(data: ResumeData): string {
    const isStudent = data.userType === 'student';
    const hasExperience = data.experience.length > 0;

    // Use refined (AI-polished) bullets where available — they're the strongest signal
    const experienceBlock = hasExperience
      ? data.experience
          .map(exp => {
            const bullets = (exp.refinedBullets && exp.refinedBullets.length > 0)
              ? exp.refinedBullets
              : (exp.rawDescription ? [exp.rawDescription] : []);
            const header = `- ${exp.role} at ${exp.company} (${exp.startDate} – ${exp.isCurrent ? 'Present' : exp.endDate})`;
            const body = bullets.length > 0
              ? bullets.map(b => `    • ${b}`).join('\n')
              : '';
            return body ? `${header}\n${body}` : header;
          })
          .join('\n')
      : '';

    const projectsBlock = data.projects.length > 0
      ? data.projects
          .map(p => {
            const bullets = (p.refinedBullets && p.refinedBullets.length > 0)
              ? p.refinedBullets
              : (p.rawDescription ? [p.rawDescription] : []);
            const header = `- ${p.name}${p.technologies ? ` (${p.technologies})` : ''}`;
            const body = bullets.length > 0
              ? bullets.map(b => `    • ${b}`).join('\n')
              : '';
            return body ? `${header}\n${body}` : header;
          })
          .join('\n')
      : '';

    const educationBlock = data.education.length > 0
      ? data.education
          .map(edu => `- ${edu.degree}${edu.field ? ` in ${edu.field}` : ''} from ${edu.school}${edu.gpa ? ` (GPA: ${edu.gpa})` : ''}`)
          .join('\n')
      : 'Not provided';

    return `
Write the 3–4 body paragraphs of a cover letter (no date, no addresses, no greeting, no closing, no signature — those are rendered separately).

═══════════════════════════════════════════════
JOB DETAILS (keyword source of truth)
═══════════════════════════════════════════════
Position: ${data.targetJob.title || 'N/A'}
Company: ${data.targetJob.company || 'N/A'}

Job Description:
${data.targetJob.description}

Before writing, mentally extract the top 3–5 hard-skill/tool keywords and the top 2 responsibility themes from the JD. Mirror those keywords verbatim (same casing) across your paragraphs where they are truthful for this candidate.

═══════════════════════════════════════════════
CANDIDATE
═══════════════════════════════════════════════
Name: ${data.personalInfo.fullName}
Type: ${isStudent ? 'Student / Entry-level' : 'Experienced Professional'}
Professional Summary: ${data.summary || '(not provided)'}

${hasExperience ? `WORK EXPERIENCE (use specific bullets as source for concrete achievements):\n${experienceBlock}` : 'WORK EXPERIENCE: (none provided)'}

${projectsBlock ? `PROJECTS:\n${projectsBlock}` : ''}

EDUCATION:
${educationBlock}

SKILLS: ${data.skills.join(', ') || '(none provided)'}

═══════════════════════════════════════════════
PARAGRAPH STRUCTURE (3–4 paragraphs, 250–400 words total)
═══════════════════════════════════════════════
Paragraph 1 — HOOK (2–3 sentences):
  Open with a specific, concrete achievement or qualification from the candidate data that directly maps to the JD's top requirement. NO "I am writing to apply for…" opening. Name the role${data.targetJob.company ? ` and ${data.targetJob.company}` : ''} in the first or second sentence. Make the reader want to keep reading.

Paragraph 2 — EVIDENCE OF FIT (4–6 sentences):
  ${isStudent
    ? 'Connect 2–3 concrete project or coursework achievements to the JD\'s technical requirements. Reference specific technologies and methodologies from the JD. Show how academic work prepared you for the role\'s day-one responsibilities.'
    : 'Reference 2–3 concrete achievements from the work experience above (pulling real details and numbers — never invent). Map each one explicitly to a JD requirement. Use the JD\'s exact keywords for tools/methodologies.'}

${isStudent
  ? `Paragraph 3 — BROADER VALUE (3–4 sentences): Highlight transferable skills, leadership/extracurriculars, or complementary strengths. Show initiative, learning velocity, and collaboration.`
  : `Paragraph 3 — BROADER VALUE (3–4 sentences): Highlight leadership, cross-functional collaboration, domain expertise, or culture-fit signals relevant to ${data.targetJob.company || 'the company'} and the role.`}

Paragraph 4 — CLOSE (2–3 sentences):
  Express specific interest in discussing how your background maps to the team's goals. One sentence thanking the reader. Forward-looking tone — no hedging, no "I look forward to hearing from you" boilerplate-only ending (you may use a fresher phrasing).

═══════════════════════════════════════════════
HARD CONSTRAINTS
═══════════════════════════════════════════════
- Return ONLY the body paragraphs, separated by ONE blank line each.
- No salutation. No closing. No signature. No date. No contact info.
- No markdown, no bullets, no headings, no code fences.
- 250–400 words total.
- Do NOT fabricate metrics, employers, tools, or credentials.
- Mirror JD hard-skill keywords verbatim when truthful for this candidate.
- Avoid clichés: "I am writing to express my interest", "proven track record" (as standalone), "team player", "think outside the box", "hit the ground running".
`;
  }
}

