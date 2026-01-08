// Infrastructure - Dependency Injection Container

import { GeminiResumeOptimizer } from '../ai/GeminiResumeOptimizer';
import { GeminiCoverLetterGenerator } from '../ai/GeminiCoverLetterGenerator';
import { WordResumeExporter } from '../export/WordResumeExporter';
import { ResumeService } from '../../application/services/ResumeService';

// Get API key from environment
// Vite exposes env variables prefixed with VITE_ via import.meta.env
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  
  if (!apiKey) {
    console.warn(
      'Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file. ' +
      'See .env.example for reference.'
    );
  }
  
  return apiKey;
};

// Initialize dependencies
export const createResumeService = (): ResumeService => {
  const apiKey = getApiKey();
  const resumeOptimizer = new GeminiResumeOptimizer(apiKey);
  const coverLetterGenerator = new GeminiCoverLetterGenerator(apiKey);
  const resumeExporter = new WordResumeExporter();
  
  return new ResumeService(resumeOptimizer, resumeExporter, coverLetterGenerator);
};

