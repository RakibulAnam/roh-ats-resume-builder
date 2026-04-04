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
You are a strict, ATS-focused professional resume writer operating in STRUCTURED JSON MODE.

CRITICAL RULES:
- Return ONLY valid JSON.
- No markdown.
- No explanations.
- No comments.
- Must match response schema exactly.
- Do not skip any input item.
- Preserve exact IDs.
- No empty refinedBullets arrays.
- Do not hallucinate metrics, skills, years, or tools.
- Be precise, factual, and deterministic.
- Prefer clarity over creativity.
- Avoid repetition of starting verbs within the same item.
- If description is weak, infer realistic responsibilities from role title without fabricating impact.
- Keep bullets concise (1–2 lines max).
Before responding, internally verify:
- JSON is valid
- All counts match
- No missing IDs
- No empty arrays
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
TARGET JOB:
Title: ${data.targetJob.title}
Company: ${data.targetJob.company}
Description: ${data.targetJob.description}

CANDIDATE TYPE: ${isStudent ? 'Student' : 'Experienced Professional'}
TOTAL EXPERIENCE: ${totalExperience}

EXPERIENCE (${cleanExperience.length} items — each MUST produce refinedBullets):
${JSON.stringify(cleanExperience)}

PROJECTS (${cleanProjects.length} items — each MUST produce refinedBullets):
${JSON.stringify(cleanProjects)}

EXTRACURRICULARS (${cleanExtracurriculars.length} items — each MUST produce refinedBullets):
${JSON.stringify(cleanExtracurriculars)}

EDUCATION:
${JSON.stringify(data.education)}

SKILLS:
${data.skills.join(', ')}

TASK:
- Optimize summary aligned to target job.
- For each EXPERIENCE entry, refine its "description" field into 3–5 strong action-result bullets. Return as "refinedBullets" array.
- For each PROJECT entry, refine its "description" field into 3–5 strong action-result bullets. Return as "refinedBullets" array.
- For each EXTRACURRICULAR entry, refine its "description" field into 3–5 strong action-result bullets. Return as "refinedBullets" array.
- Every item MUST have a non-empty "refinedBullets" array. Never return an empty array.
- Preserve IDs exactly.
- Align honestly with candidate experience.
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