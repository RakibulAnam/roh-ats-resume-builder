// Infrastructure - Gemini AI LinkedIn Connection Note Generator

import { GoogleGenAI } from '@google/genai';
import { ResumeData } from '../../domain/entities/Resume.js';
import { ILinkedInMessageGenerator } from '../../domain/usecases/GenerateLinkedInMessageUseCase.js';

// LinkedIn's connection-note hard limit is 300 characters; we aim for 280 to
// leave a buffer and because shorter notes get accepted more often.
const MAX_LENGTH = 280;

export class GeminiLinkedInMessageGenerator implements ILinkedInMessageGenerator {
  private genAI: GoogleGenAI;
  private readonly model = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generate(data: ResumeData): Promise<string> {
    const result = await this.genAI.models.generateContent({
      model: this.model,
      contents: this.buildPrompt(data),
      config: {
        temperature: 0.45,
        systemInstruction: `You write short LinkedIn connection notes that earn the accept from a hiring manager or recruiter.

FORMAT — Plain text only. No greeting like "Hi <Name>,". No signature. No emojis. No markdown. No quotes around the message. Return the note itself and nothing else.

LENGTH — HARD LIMIT ${MAX_LENGTH} characters including spaces. Shorter is better.

SHAPE — One paragraph, 2–3 sentences:
  1. One sentence naming the role / company + the candidate's single strongest credential that maps to it.
  2. One sentence with a soft, specific reason to connect ("would love to learn how your team approaches X"). No asks for referrals. No "quick chat?" phrasing.

TONE — Direct, human, low-pressure. Never fawning. No clichés ("hope this finds you well", "great opportunity", "reaching out").

HONESTY — Do not invent employers, tools, or metrics. Use only what the provided data supports.`,
      },
    });

    const text = result.text;
    if (!text) throw new Error('No response from AI');

    let cleaned = text.trim();
    // Strip accidental wrapping quotes or markdown.
    cleaned = cleaned
      .replace(/^["'`]+/, '')
      .replace(/["'`]+$/, '')
      .replace(/^\*+/, '')
      .replace(/\*+$/, '')
      .trim();

    if (cleaned.length > MAX_LENGTH) {
      // Safety trim — cut at the last sentence/word boundary before the cap.
      const slice = cleaned.slice(0, MAX_LENGTH);
      const lastPeriod = slice.lastIndexOf('.');
      const lastSpace = slice.lastIndexOf(' ');
      const cut = lastPeriod > MAX_LENGTH * 0.6 ? lastPeriod + 1 : lastSpace;
      cleaned = (cut > 0 ? slice.slice(0, cut) : slice).trim();
    }

    return cleaned;
  }

  private buildPrompt(data: ResumeData): string {
    const topBullets = data.experience
      .flatMap((e) => e.refinedBullets ?? [])
      .slice(0, 3);

    return `
Write a LinkedIn connection note from this candidate to a hiring manager or recruiter at the target company.

Role: ${data.targetJob.title || 'N/A'}
Company: ${data.targetJob.company || 'the target company'}

Candidate: ${data.personalInfo.fullName}
Summary: ${data.summary || '(not provided)'}
Top strengths:
${topBullets.length ? topBullets.map((b) => `  • ${b}`).join('\n') : '  (use the summary)'}

Job description (for picking ONE keyword to mirror):
${data.targetJob.description.slice(0, 800)}

HARD RULES
- ${MAX_LENGTH} character cap. Count spaces.
- No greeting. No signoff. No emojis. No quotes. No hashtags.
- Mirror at most ONE JD keyword.
- Never invent employers, metrics, or tools.
`;
  }
}
