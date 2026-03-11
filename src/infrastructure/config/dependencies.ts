import { GeminiResumeOptimizer } from '../ai/GeminiResumeOptimizer';
import { WordResumeExporter } from '../export/WordResumeExporter';
import { GeminiCoverLetterGenerator } from '../ai/GeminiCoverLetterGenerator';
import { GeminiResumeExtractor } from '../ai/GeminiResumeExtractor';
import { ResumeService } from '../../application/services/ResumeService';
import { SupabaseResumeRepository } from '../repositories/SupabaseResumeRepository';
import { SupabaseProfileRepository } from '../repositories/SupabaseProfileRepository';
import { SupabaseApplicationRepository } from '../repositories/SupabaseApplicationRepository';
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

if (!apiKey || apiKey === 'your_api_key_here') {
  console.error('API Key is missing or invalid. Please check .env file.');
}

const resumeOptimizer = new GeminiResumeOptimizer(apiKey);
const resumeExporter = new WordResumeExporter();
const coverLetterGenerator = new GeminiCoverLetterGenerator(apiKey);
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
    resumeRepository
  );
};
