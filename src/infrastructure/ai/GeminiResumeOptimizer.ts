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
          description: 'A professional summary tailored to the target job description.',
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
      },
      required: ['summary', 'skills'], // Experience is optional for students
    };

    const prompt = this.buildPrompt(data);

    try {
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: resumeSchema,
          systemInstruction:
            'You are a strict, detail-oriented professional resume writer.',
        },
      });

      const responseText = result.text;
      if (!responseText) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(responseText);
      return parsed as OptimizedResumeData;
    } catch (error) {
      console.error('Gemini optimization failed:', error);
      throw new Error(
        `Failed to optimize resume: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private buildPrompt(data: ResumeData): string {
    const isStudent = data.userType === 'student';
    const hasExperience = data.experience.length > 0;
    
    const experienceSection = hasExperience
      ? `Experience: ${JSON.stringify(
          data.experience.map(e => ({
            id: e.id,
            role: e.role,
            company: e.company,
            description: e.rawDescription,
          }))
        )}`
      : `Experience: None (Student/Entry-level candidate)`;

    const educationSection = data.education.length > 0
      ? `Education: ${JSON.stringify(data.education)}`
      : 'Education: Not provided';

    return `
    You are an expert Resume Writer and Career Coach specializing in Applicant Tracking Systems (ATS) and high-performance job applications.
    
    YOUR TASK: Optimize the candidate's profile to perfectly match the Target Job Description.
    
    CANDIDATE TYPE: ${isStudent ? 'Student/Entry-level' : 'Experienced Professional'}
    
    TARGET JOB PROFILE:
    Title: ${data.targetJob.title}
    Company: ${data.targetJob.company}
    Description: ${data.targetJob.description}

    CANDIDATE PROFILE:
    ${experienceSection}
    ${educationSection}
    Skills (Candidate's Input): ${data.skills.join(', ')}
    
    OPTIMIZATION INSTRUCTIONS:
    
    1. PROFESSIONAL SUMMARY (The Hook):
       - Write a powerful 3-4 sentence professional summary.
       - INTEGRATE high-value keywords from the Job Description.
       ${isStudent
         ? `- For students/entry-level candidates: Emphasize academic achievements, relevant coursework, projects, internships, volunteer work, or extracurricular activities. Highlight transferable skills, eagerness to learn, and potential value to the employer.`
         : `- Frame the candidate's background as the ideal solution to the company's needs stated in the JD.`}
       - Avoid generic fluff. Be specific about value.

    2. SKILLS (The Keywords):
       - Extract and refine the most relevant skills.
       - Prioritize hard skills and tools mentioned in the Job Description.
       ${isStudent
         ? `- For students: Include technical skills from coursework, projects, and any tools/technologies learned. Also include soft skills demonstrated through academic work, group projects, or leadership roles.`
         : `- Ensure these keywords match what an ATS would scan for.`}

    3. EXPERIENCE BULLETS (The Proof):
       ${hasExperience
         ? `- Rewrite the 'rawDescription' for each role into 3-5 high-impact bullet points.
       - STRICTLY follow the "Action Verb + Task + Result" formula.
       - Start every bullet with a strong power verb (e.g., Spearheaded, Engineered, Orchestrated, Optimized).
       - QUANTIFY results wherever possible (e.g., "Reduced latency by 40%", "Managed a budget of $50k"). If exact metrics are missing, emphasize the scale/impact of the work.
       - WEAVE IN keywords from the Job Description naturally.`
         : `- Since the candidate has no work experience, focus on:
       - Academic projects and coursework relevant to the job
       - Internships, co-ops, or part-time work (if any)
       - Volunteer work or extracurricular activities
       - Leadership roles in student organizations
       - Relevant certifications or online courses
       - Create achievement-focused bullet points using action verbs
       - Quantify achievements where possible (e.g., "Developed a web application used by 100+ students", "Led a team of 5 in a capstone project")
       - If no experience exists, return an empty array for experience.`}
    
    4. FORMAT:
       - Return strict JSON matching the provided schema.
       - If no experience exists, return an empty array for experience.
  `;
  }
}

