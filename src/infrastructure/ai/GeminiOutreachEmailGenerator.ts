// Infrastructure - Gemini AI Outreach Email Generator

import { GoogleGenAI, Type } from '@google/genai';
import { ResumeData, OutreachEmail } from '../../domain/entities/Resume.js';
import { IOutreachEmailGenerator } from '../../domain/usecases/GenerateOutreachEmailUseCase.js';

export class GeminiOutreachEmailGenerator implements IOutreachEmailGenerator {
  private genAI: GoogleGenAI;
  private readonly model = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generate(data: ResumeData): Promise<OutreachEmail> {
    const result = await this.genAI.models.generateContent({
      model: this.model,
      contents: this.buildPrompt(data),
      config: {
        temperature: 0.45,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ['subject', 'body'],
        },
        systemInstruction: `You write short, high-signal cold outreach emails that a hiring manager would actually read and reply to.

SCOPE — You produce ONE email: a subject line and a body. The body is what the sender will paste into their email client. Do NOT include "Hi <Name>," greeting, do NOT include a signoff/signature — the app renders those or the sender adds them.

LENGTH — Body 110–170 words. Subject ≤ 60 characters.

TONE — Direct, specific, respectful of the reader's time. Warm but not fawning. No clichés ("I hope this finds you well", "quick question", "synergies"). No hedging. First person, active voice.

SHAPE (body) — 3 short paragraphs:
  1. One sentence that names the role + the one most relevant credential/achievement from the candidate that maps to the role. No "I am writing to express interest".
  2. Two to three sentences of concrete evidence — specific projects, outcomes, or tools, tied to the JD. Mirror 1–2 JD keywords verbatim where truthful.
  3. A soft, specific ask — "Would a 15-minute chat next week be useful?" or "Happy to share a short write-up of <X> if helpful." Avoid generic "let me know".

HONESTY — Never invent companies, metrics, tools, or credentials. Use only what the provided candidate data supports.

OUTPUT — Return valid JSON with exactly { "subject": string, "body": string }. No markdown, no code fences, no extra fields.`,
      },
    });

    const text = result.text;
    if (!text) throw new Error('No response from AI');

    const parsed = JSON.parse(text) as OutreachEmail;
    if (!parsed.subject || !parsed.body) {
      throw new Error('Outreach email response missing required fields');
    }
    return {
      subject: parsed.subject.trim(),
      body: parsed.body.trim(),
    };
  }

  private buildPrompt(data: ResumeData): string {
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
        return `- ${p.name}${bullets.length ? `\n    • ${bullets.join('\n    • ')}` : ''}`;
      })
      .join('\n');

    return `
Write the subject line and body for a cold outreach email from this candidate to the hiring manager for the role below.

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
Summary: ${data.summary || '(not provided)'}

${experience ? `Work experience:\n${experience}` : ''}
${projects ? `\nProjects:\n${projects}` : ''}

Skills: ${data.skills.join(', ') || '(not provided)'}

═══════════════════════════════════════════════
RULES
═══════════════════════════════════════════════
- Subject: ≤ 60 chars, specific to the role${data.targetJob.title ? ` (${data.targetJob.title})` : ''}, no "Re:" / "Fwd:" prefixes, no emojis.
- Body: 110–170 words, 3 short paragraphs, no greeting, no signoff.
- Mirror 1–2 JD keywords verbatim.
- Do not invent details.
`;
  }
}
