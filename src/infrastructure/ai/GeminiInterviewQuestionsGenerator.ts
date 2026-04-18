// Infrastructure - Gemini AI Interview Questions Generator

import { GoogleGenAI, Type } from '@google/genai';
import {
  ResumeData,
  InterviewQuestion,
  InterviewQuestionCategory,
} from '../../domain/entities/Resume';
import { IInterviewQuestionsGenerator } from '../../domain/usecases/GenerateInterviewQuestionsUseCase';

const VALID_CATEGORIES: InterviewQuestionCategory[] = [
  'Behavioral',
  'Technical',
  'Role-specific',
  'Values & Culture',
  'Situational',
];

export class GeminiInterviewQuestionsGenerator implements IInterviewQuestionsGenerator {
  private genAI: GoogleGenAI;
  private readonly model = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generate(data: ResumeData): Promise<InterviewQuestion[]> {
    const result = await this.genAI.models.generateContent({
      model: this.model,
      contents: this.buildPrompt(data),
      config: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
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
          required: ['questions'],
        },
        systemInstruction: `You are a senior interviewer who runs final-round loops for the role in the job description. You produce the 6–8 questions a well-prepared candidate MUST be ready for, along with why each is asked and how to answer it well.

OUTPUT FORMAT — Valid JSON matching the schema. No markdown, no code fences, no extra fields.

QUESTION MIX — Produce 6–8 total. Span these categories where relevant to the JD:
  • "Behavioral"        — past-situation questions (STAR-format answers).
  • "Technical"         — concrete knowledge or problem-solving specific to the role.
  • "Role-specific"     — questions about how the candidate would handle day-1 responsibilities.
  • "Values & Culture"  — why-this-company / motivation / collaboration style.
  • "Situational"       — hypothetical "what would you do if…" scenarios.

QUESTION QUALITY
  • Be specific to this JD and this candidate's background — NOT generic ("tell me about yourself" is banned).
  • Each question should be something a real interviewer would actually ask in this loop.
  • Write the question exactly as it would be spoken.

WHY ASKED (2–3 sentences)
  • Explain the signal the interviewer is extracting — what they are scoring.

ANSWER STRATEGY (3–5 sentences)
  • Explicit structure (e.g. STAR, trade-off framing, brief-then-deep).
  • Pull concrete hooks from the candidate's data ("lean on your X project", "lead with the Y migration") — by name, without fabricating new facts.
  • Flag common failure modes to avoid.

HONESTY — Do not invent employers, tools, or metrics in the answer-strategy hooks. Only reference things present in the candidate data.`,
      },
    });

    const text = result.text;
    if (!text) throw new Error('No response from AI');

    const parsed = JSON.parse(text) as { questions?: InterviewQuestion[] };
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Interview questions response was empty');
    }

    return parsed.questions.map((q) => ({
      question: (q.question ?? '').trim(),
      category: this.normalizeCategory(q.category),
      whyAsked: (q.whyAsked ?? '').trim(),
      answerStrategy: (q.answerStrategy ?? '').trim(),
    }));
  }

  private normalizeCategory(raw: unknown): InterviewQuestionCategory {
    const value = String(raw ?? '').trim();
    const match = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === value.toLowerCase(),
    );
    return match ?? 'Role-specific';
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
        return `- ${e.role} at ${e.company}${bullets.length ? `\n    • ${bullets.join('\n    • ')}` : ''}`;
      })
      .join('\n');

    const projects = data.projects
      .map((p) => {
        const bullets = p.refinedBullets?.length
          ? p.refinedBullets
          : p.rawDescription
          ? [p.rawDescription]
          : [];
        return `- ${p.name}${p.technologies ? ` (${p.technologies})` : ''}${bullets.length ? `\n    • ${bullets.join('\n    • ')}` : ''}`;
      })
      .join('\n');

    return `
Produce 6–8 interview questions for this role, tuned to this candidate.

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
- Output strict JSON matching the schema — array of 6–8 question objects inside { "questions": [...] }.
- Each question must feel written FOR this specific JD — not a generic prep sheet.
- "answerStrategy" must reference concrete items from the candidate data by name (e.g. "anchor the answer in your $X project").
- Never fabricate employers, metrics, or tools.
`;
  }
}
