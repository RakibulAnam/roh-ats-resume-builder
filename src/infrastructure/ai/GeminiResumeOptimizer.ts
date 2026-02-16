// Infrastructure - Gemini AI Implementation

import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ResumeData, OptimizedResumeData } from '../../domain/entities/Resume';
import { IResumeOptimizer } from '../../domain/usecases/OptimizeResumeUseCase';

export class GeminiResumeOptimizer implements IResumeOptimizer {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async optimize(data: ResumeData): Promise<OptimizedResumeData> {
    const resumeSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: data.userType === 'student' ? 'A career objective focusing on potential and academic background.' : 'A professional summary tailored to the target job description.',
        },
        skills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'A list of relevant technical and soft skills extracted and refined.',
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
                description: 'Action-oriented, quantified achievement bullet points.',
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
                description: 'Refined bullet points highlighting technical contribution and impact.',
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
                description: 'Bullet points highlighting leadership and soft skills.',
              },
            },
            required: ['id', 'refinedBullets'],
          },
        },
      },
      required: ['summary', 'skills'],
    };

    const prompt = this.buildPrompt(data);
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const result = await this.genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: resumeSchema,
            systemInstruction:
              'You are a strict, detail-oriented professional resume writer. You NEVER hallucinate facts. You MUST generate refined content for EVERY SINGLE item provided. Do not skip any experience or project.',
          },
        });

        const responseText = result.text;
        if (!responseText) {
          throw new Error('No response from AI');
        }

        const parsed = JSON.parse(responseText);
        return parsed as OptimizedResumeData;
      } catch (error) {
        attempt++;
        console.warn(`Gemini optimization attempt ${attempt} failed:`, error);

        const isOverloaded = error instanceof Error && (
          error.message.includes('503') ||
          error.message.includes('overloaded') ||
          error.message.includes('Too Many Requests')
        );

        if (attempt >= maxRetries) {
          throw new Error(
            `Failed to optimize resume after ${maxRetries} attempts. ${isOverloaded ? 'The AI model is currently overloaded. Please try again in a minute.' : error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unexpected error in retry loop');
  }

  private calculateTotalExperience(experience: { startDate: string; endDate: string; isCurrent: boolean }[]): string {
    let totalMonths = 0;

    experience.forEach(exp => {
      const start = new Date(exp.startDate);
      const end = exp.isCurrent ? new Date() : new Date(exp.endDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
      }
    });

    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;

    if (years === 0 && remainingMonths === 0) return "No Experience";

    let durationString = "";
    if (years > 0) durationString += `${years} year${years > 1 ? 's' : ''}`;
    if (remainingMonths > 0) durationString += ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;

    return durationString.trim();
  }

  private buildPrompt(data: ResumeData): string {
    const isStudent = data.userType === 'student';
    const hasExperience = data.experience.length > 0;
    const totalExperienceDuration = this.calculateTotalExperience(data.experience);

    const experienceSection = hasExperience
      ? `Experience (${totalExperienceDuration}): ${JSON.stringify(
        data.experience.map(e => ({
          id: e.id,
          role: e.role,
          company: e.company,
          description: e.rawDescription || "No description provided",
        }))
      )}`
      : `Experience: None (Student/Entry-level candidate)`;

    const projectsSection = data.projects && data.projects.length > 0
      ? `Projects: ${JSON.stringify(data.projects.map(p => ({
        id: p.id,
        name: p.name,
        technologies: p.technologies,
        description: p.rawDescription || "No description provided",
      })))}`
      : 'Projects: None';

    const extracurricularsSection = data.extracurriculars && data.extracurriculars.length > 0
      ? `Extracurriculars: ${JSON.stringify(data.extracurriculars.map(e => ({
        id: e.id,
        title: e.title,
        organization: e.organization,
        description: e.description || "No description provided",
      })))}`
      : 'Extracurriculars: None';

    const educationSection = data.education.length > 0
      ? `Education: ${JSON.stringify(data.education)}`
      : 'Education: Not provided';

    return `
    You are an expert Resume Writer and Career Coach specializing in Applicant Tracking Systems (ATS).
    
    YOUR TASK: Optimize the candidate's profile to perfectly match the Target Job Description.
    
    CRITICAL RULES:
    1. **ACCURACY**: The candidate has exactly **${totalExperienceDuration}** of experience. DO NOT hallucinate.
    2. **DESCRIPTIONS**: REWRITE the "description" fields into high-impact bullet points.
    3. **OUTPUT format**: Return strict JSON matching the schema.
    4. **COMPLETENESS**: You MUST return a refined entry for EVERY item in Experience, Projects, and Extracurriculars. Do not skip any.
    5. **ID PRESERVATION**: You MUST return the exact same 'id' for each item as provided in the input. This is used for merging.

    CANDIDATE TYPE: ${isStudent ? 'Student/Entry-level' : 'Experienced Professional'}
    
    TARGET JOB PROFILE:
    Title: ${data.targetJob.title}
    Company: ${data.targetJob.company}
    Description: ${data.targetJob.description}

    CANDIDATE PROFILE:
    ${experienceSection}
    ${projectsSection}
    ${extracurricularsSection}
    ${educationSection}
    Skills (Candidate's Input): ${data.skills.join(', ')}
    
    OPTIMIZATION INSTRUCTIONS:
    
    1. ${isStudent ? 'RESUME OBJECTIVE' : 'PROFESSIONAL SUMMARY'}:
       ${isStudent
        ? '- Write a concise Resume Objective focusing on potential, academic background, and real project experience. Mention "seeking internship/role".'
        : `- Write a powerful 3-4 sentence professional summary. Mention the candidate's actual experience (approx. ${totalExperienceDuration}).`
      }
       - **CRITICAL**: The summary must be a **TRUE reflection of the candidate's actual experience** passed in the "Experience" section.
       - **DO NOT** claim the candidate is a "Specialist" or "Expert" in the Target Job Title if their experience does not support it (e.g., if they are a Flutter Dev applying for a Swift role, say "Experienced Mobile Developer with a strong background in Flutter and growing expertise in Swift", NOT "Senior Swift Engineer").
       - **ALIGNMENT**: Highlight skills from the candidate's profile that overlapping with the Job Description. Do not invent skills.

    2. SKILLS:
       - Extract and refine the most relevant skills.
       
    3. REFINEMENT (Experience / Projects / Extracurriculars):
       - **FOR EACH ITEM** in the input arrays, generate a corresponding item in the output array with the **SAME ID**.
       - **Refine** the provided descriptions into 3-5 bullet points each.
       - **CLEANING**: Treat the input "description" as a raw "brain dump". Ignore and remove all existing formatting (hyphens, bullets, numbers, newlines).
       - **FORMATTING**: The output refinedBullets array must contain ONLY the text content. **DO NOT** include leading bullet characters (like -, *, •) or numbers in the strings.
       - Use "Active Verb + Task + Result" formula.

    4. **QUANTIFY IMPACT (CRITICAL)**:
       - **Try to parse quantifying impact** from the user's brain dump. Look for numbers, percentages, team sizes, budget handling, etc.
       - If exact numbers are NOT present, **DO NOT HALLUCINATE** arbitrary success metrics (e.g., "increased revenue by 20%" when the user didn't say that).
       - Instead, Look for implied numbers in activities (e.g., "worked in an international team" -> "Collaborated within a diverse international team of 10+ members" -> ONLY IF REASONABLE, otherwise just "Collaborated within a diverse international team").
       - Generally, focus on scale and scope if direct metrics are missing.

    5. **VOCABULARY & GRAMMAR**:
       - **NO REPETITION**: Do not start multiple bullets with the same verb (e.g., don't use "Managed" three times in a row). Use synonyms (e.g., Orchestrated, Led, Supervised, Oversaw).
       - **ACTIVE VERBS**: Use strong, high-impact action verbs.
       - **GRAMMAR**: Ensure 100% grammatical correctness and perfect spelling.
       - **JOB ALIGNMENT**: Tailor the experience to match the Job Description where honest and possible.
       
       - **HANDLE WEAK INPUT**: If a description is empty, "No description provided", or very weak:
         - **DO NOT** return empty bullets.
         - **DO NOT** skip the item.
         - **YOU MUST** generate 3 professional bullet points based on the **Job Title/Role** and typical responsibilities for that role.
         - **CRITICAL**: The 'refinedBullets' array MUST have at least 1 item (preferably 3). Never return an empty array.
       - For Projects: Highlight technologies used and the outcome.
       - For Extracurriculars: Highlight leadership and initiative.
   `;
  }
}

