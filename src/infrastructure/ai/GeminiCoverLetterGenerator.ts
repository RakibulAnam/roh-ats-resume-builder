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
          systemInstruction:
            'You are an expert cover letter writer specializing in creating compelling, personalized cover letters that get candidates noticed by recruiters and hiring managers.',
        },
      });

      const responseText = result.text;
      if (!responseText) {
        throw new Error('No response from AI');
      }

      return responseText.trim();
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      throw new Error(
        `Failed to generate cover letter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private buildPrompt(data: ResumeData): string {
    const isStudent = data.userType === 'student';
    const hasExperience = data.experience.length > 0;

    return `
    Write a professional, compelling cover letter for the following job application.
    
    JOB DETAILS:
    Position: ${data.targetJob.title}
    Company: ${data.targetJob.company}
    Job Description: ${data.targetJob.description}
    
    CANDIDATE INFORMATION:
    Name: ${data.personalInfo.fullName}
    Email: ${data.personalInfo.email}
    Phone: ${data.personalInfo.phone}
    Location: ${data.personalInfo.location}
    ${data.personalInfo.linkedin ? `LinkedIn: ${data.personalInfo.linkedin}` : ''}
    
    CANDIDATE PROFILE:
    Type: ${isStudent ? 'Student/Entry-level candidate' : 'Experienced professional'}
    Professional Summary: ${data.summary || 'Not provided'}
    
    ${hasExperience
      ? `Work Experience:
    ${data.experience
      .map(
        exp =>
          `- ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate})`
      )
      .join('\n    ')}`
      : ''}
    
    Education:
    ${data.education.length > 0
      ? data.education
          .map(
            edu =>
              `- ${edu.degree}${edu.field ? ` in ${edu.field}` : ''} from ${edu.school} (${edu.startDate} - ${edu.endDate})`
          )
          .join('\n    ')
      : 'Not provided'}
    
    Key Skills: ${data.skills.join(', ')}
    
    COVER LETTER REQUIREMENTS:
    
    1. FORMAT:
       - Professional business letter format
       - Include date, recipient address (use "Hiring Manager" if company name is provided, otherwise "Hiring Manager")
       - Proper greeting, body paragraphs, and closing
       - Include candidate's contact information at the top
    
    2. CONTENT STRUCTURE:
       - Opening paragraph: Express genuine interest in the position and company. Mention where you learned about the opportunity.
       - Body paragraphs (2-3): 
         ${isStudent
           ? `- Highlight relevant coursework, projects, internships, or academic achievements
         - Emphasize transferable skills and eagerness to learn
         - Connect academic experience to job requirements
         - Mention any relevant extracurricular activities or leadership roles`
           : `- Highlight most relevant work experience and achievements
         - Quantify accomplishments where possible
         - Connect your experience directly to the job requirements
         - Show how you can solve their problems`}
       - Closing paragraph: Reiterate enthusiasm, request an interview, and provide contact information
    
    3. TONE:
       - Professional yet personable
       - Confident but not arrogant
       - Enthusiastic and genuine
       - ${isStudent ? 'Show eagerness to learn and grow' : 'Demonstrate expertise and value'}
    
    4. KEYWORDS:
       - Naturally incorporate keywords from the job description
       - Use industry-appropriate terminology
       - Match the company's tone and culture (if evident from job description)
    
    5. LENGTH:
       - Approximately 3-4 paragraphs
       - One page maximum
       - Concise but comprehensive
    
    6. PERSONALIZATION:
       - Reference specific aspects of the job description
       - Show you've researched and understand the role
       - Demonstrate alignment between your background and their needs
    
    Write the complete cover letter now, including all formatting elements (date, addresses, salutation, body, closing, signature line).
    `;
  }
}

