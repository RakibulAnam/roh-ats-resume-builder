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
          systemInstruction: `You are an expert cover letter writer. You write ONLY the body paragraphs of a cover letter — no date, no address block, no greeting/salutation, no closing line, no signature. The application handles all formatting chrome (header, "Dear Hiring Manager,", "Sincerely,", signature block) separately. Return ONLY the 3–4 body paragraphs of plain text, separated by blank lines. No markdown. No bullet points. No bold formatting.`,
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

    return `
Write ONLY the body paragraphs for a professional cover letter. Do NOT include any of the following — they are handled separately by the application:
- Date
- Sender address / contact information
- Recipient address
- "Dear Hiring Manager," or any greeting
- "Sincerely," or any closing
- Signature or name at the bottom

Return exactly 3–4 paragraphs of plain text separated by blank lines.

JOB DETAILS:
Position: ${data.targetJob.title}
Company: ${data.targetJob.company}
Job Description: ${data.targetJob.description}

CANDIDATE:
Name: ${data.personalInfo.fullName}
Type: ${isStudent ? 'Student / Entry-level' : 'Experienced Professional'}
Summary: ${data.summary || 'Not provided'}

${hasExperience
  ? `WORK EXPERIENCE:
${data.experience
  .map(exp => `- ${exp.role} at ${exp.company} (${exp.startDate} – ${exp.isCurrent ? 'Present' : exp.endDate})`)
  .join('\n')}`
  : ''}

${data.projects.length > 0
  ? `PROJECTS:
${data.projects
  .map(p => `- ${p.name}: ${p.rawDescription?.substring(0, 120) || 'N/A'}`)
  .join('\n')}`
  : ''}

EDUCATION:
${data.education.length > 0
  ? data.education
      .map(edu => `- ${edu.degree}${edu.field ? ` in ${edu.field}` : ''} from ${edu.school}`)
      .join('\n')
  : 'Not provided'}

SKILLS: ${data.skills.join(', ')}

PARAGRAPH STRUCTURE:
1. Opening (2–3 sentences): Express genuine interest in the ${data.targetJob.title} role${data.targetJob.company ? ` at ${data.targetJob.company}` : ''}. Briefly state your strongest qualification.
2. Body (3–5 sentences): ${isStudent
  ? 'Highlight relevant projects, coursework, or academic achievements. Emphasize transferable skills and eagerness to learn. Connect your background to job requirements.'
  : 'Highlight your most relevant experience and quantifiable achievements. Connect your track record directly to the job requirements. Show how you solve their specific problems.'}
3. ${isStudent ? 'Additional body (2–3 sentences): Mention extracurriculars, leadership, or internships that demonstrate soft skills.' : 'Additional body (2–3 sentences): Demonstrate culture fit, leadership, or complementary skills that add value beyond technical requirements.'}
4. Closing (2–3 sentences): Reiterate enthusiasm. Express interest in discussing the opportunity further. Thank the reader.

TONE: Professional, confident, genuine. ${isStudent ? 'Show eagerness to learn.' : 'Demonstrate expertise and value.'}
Naturally incorporate keywords from the job description. Keep it concise — one page maximum.
`;
  }
}

