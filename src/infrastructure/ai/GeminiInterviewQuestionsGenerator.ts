// Infrastructure - Gemini AI Interview Questions Generator

import { GoogleGenAI, Type } from '@google/genai';
import {
  ResumeData,
  InterviewQuestion,
  InterviewQuestionCategory,
} from '../../domain/entities/Resume.js';
import { IInterviewQuestionsGenerator } from '../../domain/usecases/GenerateInterviewQuestionsUseCase.js';
import {
  buildCandidateContext,
  assertNoFabricatedTools,
  assertInterviewAnchorCoverage,
} from './prompts/toolkitContext.js';

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

GROUND IN THE CANDIDATE — the prompt presents the candidate's full profile (experience, projects, education, certifications, awards, publications, extracurriculars, languages, skills) FIRST and the JD SECOND. Each question and especially each answerStrategy must hook into a SPECIFIC item in the candidate's evidence by name. "Lean on your relevant experience" is a failure; "lead with the migration you ran at Acme" is the bar.

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
  • MUST reference at least one named item from the candidate evidence — by name (the company, the role, the project, the certification, the award, the school). Do NOT use placeholders like "your X project" or "the relevant migration"; name it.
  • Flag common failure modes to avoid.

GROUNDING REQUIREMENT (enforced — failure triggers a retry): the majority of answerStrategies must contain a literal candidate proper noun. Vague "anchor in your relevant experience" is treated as ungrounded.

HONESTY — Do not invent employers, tools, or metrics in the answer-strategy hooks. Only reference things present in the candidate evidence.`,
      },
    });

    const text = result.text;
    if (!text) throw new Error('No response from AI');

    const parsed = JSON.parse(text) as { questions?: InterviewQuestion[] };
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Interview questions response was empty');
    }

    const questions = parsed.questions.map((q) => ({
      question: (q.question ?? '').trim(),
      category: this.normalizeCategory(q.category),
      whyAsked: (q.whyAsked ?? '').trim(),
      answerStrategy: (q.answerStrategy ?? '').trim(),
    }));

    // Fabrication guard runs across every text field — questions, whys,
    // strategies — so a tool that wasn't in evidence anywhere triggers a retry.
    const fullText = questions
      .map(q => `${q.question}\n${q.whyAsked}\n${q.answerStrategy}`)
      .join('\n');
    assertNoFabricatedTools(fullText, data);
    assertInterviewAnchorCoverage(questions.map(q => q.answerStrategy), data);

    return questions;
  }

  private normalizeCategory(raw: unknown): InterviewQuestionCategory {
    const value = String(raw ?? '').trim();
    const match = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === value.toLowerCase(),
    );
    return match ?? 'Role-specific';
  }

  private buildPrompt(data: ResumeData): string {
    const candidateContext = buildCandidateContext(data);

    return `
Produce 6–8 interview questions for this role, tuned to this specific candidate.

═══════════════════════════════════════════════
CANDIDATE EVIDENCE (source of truth — every answerStrategy must hook into a named item from below)
═══════════════════════════════════════════════
${candidateContext}

═══════════════════════════════════════════════
TARGET ROLE (filter & ordering signal)
═══════════════════════════════════════════════
Title: ${data.targetJob.title || 'N/A'}
Company: ${data.targetJob.company || 'the hiring company'}

Job Description:
${data.targetJob.description}

═══════════════════════════════════════════════
RULES
═══════════════════════════════════════════════
- Output strict JSON matching the schema — array of 6–8 question objects inside { "questions": [...] }.
- Each question must feel written FOR this specific JD — not a generic prep sheet.
- "answerStrategy" MUST reference a concrete item from the CANDIDATE EVIDENCE by name (a real company, role, project name, certification, award, or school). Do not write "your relevant project" or "the migration you ran" — name it.
- Never fabricate employers, metrics, or tools. Only reference items present in the CANDIDATE EVIDENCE block.
`;
  }
}
