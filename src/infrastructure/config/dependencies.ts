import { GeminiResumeOptimizer } from '../ai/GeminiResumeOptimizer';
import { CompositeResumeExporter } from '../export/CompositeResumeExporter';
import { GeminiCoverLetterGenerator } from '../ai/GeminiCoverLetterGenerator';
import { GeminiResumeExtractor } from '../ai/GeminiResumeExtractor';
import { GeminiOutreachEmailGenerator } from '../ai/GeminiOutreachEmailGenerator';
import { GeminiLinkedInMessageGenerator } from '../ai/GeminiLinkedInMessageGenerator';
import { GeminiInterviewQuestionsGenerator } from '../ai/GeminiInterviewQuestionsGenerator';
import { ResumeService } from '../../application/services/ResumeService';
import { SupabaseResumeRepository } from '../repositories/SupabaseResumeRepository';
import { SupabaseProfileRepository } from '../repositories/SupabaseProfileRepository';
import { SupabaseApplicationRepository } from '../repositories/SupabaseApplicationRepository';
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

if (!apiKey || apiKey === 'your_api_key_here') {
  console.error('API Key is missing or invalid. Please check .env file.');
}

const resumeOptimizer = new GeminiResumeOptimizer(apiKey);
const resumeExporter = new CompositeResumeExporter();
const coverLetterGenerator = new GeminiCoverLetterGenerator(apiKey);
const outreachEmailGenerator = new GeminiOutreachEmailGenerator(apiKey);
const linkedInMessageGenerator = new GeminiLinkedInMessageGenerator(apiKey);
const interviewQuestionsGenerator = new GeminiInterviewQuestionsGenerator(apiKey);
const resumeRepository = new SupabaseResumeRepository();

export const resumeExtractor = new GeminiResumeExtractor(apiKey);

// Supabase Repositories
export const profileRepository = new SupabaseProfileRepository();
export const applicationRepository = new SupabaseApplicationRepository();

export const createResumeService = () => {
  return new ResumeService(
    resumeOptimizer,
    resumeExporter,
    coverLetterGenerator,
    outreachEmailGenerator,
    linkedInMessageGenerator,
    interviewQuestionsGenerator,
    resumeRepository,
    profileRepository
  );
};
