// Infrastructure — Gemini AI Combined Toolkit Generator
//
// Produces cover letter + outreach email + LinkedIn note + interview questions
// in a single call with one unified response schema. This is the hot-path used
// on initial resume generation; the per-artifact generators are still wired
// individually for the single-item regenerate flow.

import { GoogleGenAI, Type } from '@google/genai';
import {
  ResumeData,
  GeneratedToolkit,
  InterviewQuestion,
  InterviewQuestionCategory,
} from '../../domain/entities/Resume';
import { IToolkitGenerator } from '../../domain/usecases/GenerateToolkitUseCase';

const LINKEDIN_MAX = 280;

const VALID_CATEGORIES: InterviewQuestionCategory[] = [
  'Behavioral',
  'Technical',
  'Role-specific',
  'Values & Culture',
  'Situational',
];

interface RawToolkitResponse {
  coverLetter?: string;
  outreachEmail?: { subject?: string; body?: string };
  linkedInMessage?: string;
  interviewQuestions?: Array<{
    question?: string;
    category?: string;
    whyAsked?: string;
    answerStrategy?: string;
  }>;
}

export class GeminiToolkitGenerator implements IToolkitGenerator {
  private genAI: GoogleGenAI;
  private readonly model = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generate(data: ResumeData): Promise<GeneratedToolkit> {
    const result = await this.genAI.models.generateContent({
      model: this.model,
      contents: this.buildPrompt(data),
      config: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coverLetter: { type: Type.STRING },
            outreachEmail: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                body: { type: Type.STRING },
              },
              required: ['subject', 'body'],
            },
            linkedInMessage: { type: Type.STRING },
            interviewQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  category: { type: Type.STRING },
                  whyAsked: { type: Type.STRING },
                  answerStrategy: { type: Type.STRING },
                },
                required: ['question', 'category', 'whyAsked', 'answerStrategy'],
              },
            },
          },
          required: ['coverLetter', 'outreachEmail', 'linkedInMessage', 'interviewQuestions'],
        },
        systemInstruction: this.buildSystemInstruction(),
      },
    });

    const text = result.text;
    if (!text) throw new Error('No response from AI');

    const parsed: RawToolkitResponse = this.safeJsonParse(text);

    const coverLetter = (parsed.coverLetter ?? '').trim();
    if (!coverLetter) {
      throw new Error('Toolkit response missing cover letter');
    }

    const subject = (parsed.outreachEmail?.subject ?? '').trim();
    const body = (parsed.outreachEmail?.body ?? '').trim();
    if (!subject || !body) {
      throw new Error('Toolkit response missing outreach email');
    }

    let linkedInMessage = (parsed.linkedInMessage ?? '').trim();
    // Strip accidental wrapping quotes or markdown.
    linkedInMessage = linkedInMessage
      .replace(/^["'`]+/, '')
      .replace(/["'`]+$/, '')
      .replace(/^\*+/, '')
      .replace(/\*+$/, '')
      .trim();
    if (!linkedInMessage) {
      throw new Error('Toolkit response missing LinkedIn note');
    }
    if (linkedInMessage.length > LINKEDIN_MAX) {
      const slice = linkedInMessage.slice(0, LINKEDIN_MAX);
      const lastPeriod = slice.lastIndexOf('.');
      const lastSpace = slice.lastIndexOf(' ');
      const cut = lastPeriod > LINKEDIN_MAX * 0.6 ? lastPeriod + 1 : lastSpace;
      linkedInMessage = (cut > 0 ? slice.slice(0, cut) : slice).trim();
    }

    const questionsRaw = Array.isArray(parsed.interviewQuestions)
      ? parsed.interviewQuestions
      : [];
    const interviewQuestions: InterviewQuestion[] = questionsRaw
      .map((q) => ({
        question: (q.question ?? '').trim(),
        category: this.normalizeCategory(q.category),
        whyAsked: (q.whyAsked ?? '').trim(),
        answerStrategy: (q.answerStrategy ?? '').trim(),
      }))
      .filter((q) => q.question && q.whyAsked && q.answerStrategy);

    if (interviewQuestions.length === 0) {
      throw new Error('Toolkit response missing interview questions');
    }

    return {
      coverLetter,
      outreachEmail: { subject, body },
      linkedInMessage,
      interviewQuestions,
    };
  }

  private normalizeCategory(raw: unknown): InterviewQuestionCategory {
    const value = String(raw ?? '').trim();
    const match = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === value.toLowerCase(),
    );
    return match ?? 'Role-specific';
  }

  private safeJsonParse(text: string): RawToolkitResponse {
    try {
      return JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  }

  private buildSystemInstruction(): string {
    return `You are producing the complete application toolkit that ships alongside a candidate's tailored resume. Four artifacts in ONE JSON payload — no extras, no commentary.

OUTPUT FORMAT — Valid JSON matching the schema. No markdown, no code fences, no extra fields. Every field required and non-empty.

Each artifact has its own rules. Follow them in isolation — treat them as four separate deliverables that happen to ship in one response.

═══════════════════════════════════════════════
ARTIFACT 1 — COVER LETTER (string, coverLetter)
═══════════════════════════════════════════════
LENGTH — 250–400 words of body text. No date line, no address block, no "Dear <Name>," greeting, no signoff — the app renders those around the body.

TONE — Professional, specific, confident, first person active voice. No clichés ("I am writing to express interest", "dynamic self-starter", "passion for excellence"). No hedging.

SHAPE — 3–4 short paragraphs:
  1. Opening that names the role + the candidate's strongest credential mapped to it (no "I am applying for…").
  2. One or two paragraphs of concrete evidence — specific projects, outcomes, tools — mirroring JD keywords where truthful.
  3. Closing that ties the candidate's trajectory to what the role would let them do next. Soft, confident, not fawning.

HONESTY — Do not invent employers, metrics, tools, or credentials.

═══════════════════════════════════════════════
ARTIFACT 2 — OUTREACH EMAIL (object, outreachEmail)
═══════════════════════════════════════════════
SUBJECT — ≤ 60 characters, specific to the role, no "Re:" / "Fwd:" prefixes, no emojis.

BODY — 110–170 words, 3 short paragraphs, no greeting, no signoff:
  1. One sentence naming the role + the one most relevant credential that maps to it.
  2. 2–3 sentences of concrete evidence tied to the JD (mirror 1–2 JD keywords verbatim where truthful).
  3. A soft specific ask ("Would a 15-minute chat next week be useful?" / "Happy to share a short write-up of X if helpful.") — never generic "let me know".

TONE — Direct, respectful of reader's time, warm but not fawning. No clichés ("hope this finds you well", "quick question", "synergies"). No hedging.

HONESTY — Use only what the provided candidate data supports.

═══════════════════════════════════════════════
ARTIFACT 3 — LINKEDIN CONNECTION NOTE (string, linkedInMessage)
═══════════════════════════════════════════════
LENGTH — HARD LIMIT ${LINKEDIN_MAX} characters. Count spaces. Shorter is better.

FORMAT — Plain text, one paragraph (2–3 sentences). No greeting, no signoff, no emojis, no markdown, no quotes around the message.

SHAPE —
  1. One sentence naming the role / company + the candidate's single strongest credential that maps to it.
  2. One sentence with a soft specific reason to connect ("would love to learn how your team approaches X"). No referral asks. No "quick chat?" phrasing.

TONE — Direct, human, low-pressure. Mirror at most ONE JD keyword. Never invent employers, tools, or metrics.

═══════════════════════════════════════════════
ARTIFACT 4 — INTERVIEW QUESTIONS (array, interviewQuestions)
═══════════════════════════════════════════════
COUNT — 6–8 questions. Span these categories where relevant to the JD: "Behavioral", "Technical", "Role-specific", "Values & Culture", "Situational".

QUESTION — Specific to THIS JD and THIS candidate's background. Banned: "Tell me about yourself." Write exactly as spoken.

WHY ASKED — 2–3 sentences naming the signal the interviewer is scoring.

ANSWER STRATEGY — 3–5 sentences with explicit structure (STAR, trade-off framing, brief-then-deep). Reference concrete items from the candidate data by name ("anchor in your X project", "lead with the Y migration") without inventing new facts. Flag common failure modes to avoid.

HONESTY — Never invent employers, tools, or metrics in answer-strategy hooks.`;
  }

  private buildPrompt(data: ResumeData): string {
    const isStudent = data.userType === 'student';

    const experience = data.experience
      .map((e) => {
        const bullets = e.refinedBullets?.length
          ? e.refinedBullets
          : e.rawDescription
          ? [e.rawDescription]
          : [];
        return `- ${e.role} at ${e.company}${
          bullets.length ? `\n    • ${bullets.join('\n    • ')}` : ''
        }`;
      })
      .join('\n');

    const projects = data.projects
      .map((p) => {
        const bullets = p.refinedBullets?.length
          ? p.refinedBullets
          : p.rawDescription
          ? [p.rawDescription]
          : [];
        return `- ${p.name}${p.technologies ? ` (${p.technologies})` : ''}${
          bullets.length ? `\n    • ${bullets.join('\n    • ')}` : ''
        }`;
      })
      .join('\n');

    return `
Produce the full application toolkit — cover letter, outreach email, LinkedIn note, and 6–8 interview questions — for this candidate against this role.

═══════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════
Title: ${data.targetJob.title || 'N/A'}
Company: ${data.targetJob.company || 'the hiring company'}

Job Description:
${data.targetJob.description}

═══════════════════════════════════════════════
CANDIDATE
═══════════════════════════════════════════════
Name: ${data.personalInfo.fullName}
Type: ${isStudent ? 'Student / Entry-level' : 'Experienced Professional'}
Summary: ${data.summary || '(not provided)'}

${experience ? `Work experience:\n${experience}` : ''}
${projects ? `\nProjects:\n${projects}` : ''}

Skills: ${data.skills.join(', ') || '(not provided)'}

═══════════════════════════════════════════════
RULES
═══════════════════════════════════════════════
- Strict JSON matching the schema. Every field non-empty.
- Each artifact follows its own rules from the system instruction.
- Never invent employers, metrics, or tools.
- Mirror JD keywords verbatim where truthful.
`;
  }
}
