// Application Service - Orchestrates use cases

import { ResumeData, OptimizedResumeData } from '../../domain/entities/Resume';
import { OptimizeResumeUseCase, IResumeOptimizer } from '../../domain/usecases/OptimizeResumeUseCase';
import { ExportResumeUseCase, IResumeExporter } from '../../domain/usecases/ExportResumeUseCase';
import { GenerateCoverLetterUseCase, ICoverLetterGenerator } from '../../domain/usecases/GenerateCoverLetterUseCase';

export class ResumeService {
  private optimizeUseCase: OptimizeResumeUseCase;
  private exportUseCase: ExportResumeUseCase;
  private coverLetterUseCase: GenerateCoverLetterUseCase;

  constructor(
    resumeOptimizer: IResumeOptimizer,
    resumeExporter: IResumeExporter,
    coverLetterGenerator: ICoverLetterGenerator
  ) {
    this.optimizeUseCase = new OptimizeResumeUseCase(resumeOptimizer);
    this.exportUseCase = new ExportResumeUseCase(resumeExporter);
    this.coverLetterUseCase = new GenerateCoverLetterUseCase(coverLetterGenerator);
  }

  async optimizeResume(data: ResumeData): Promise<OptimizedResumeData> {
    const optimizedData = await this.optimizeUseCase.execute(data);
    
    // Generate cover letter after resume optimization
    try {
      const coverLetter = await this.coverLetterUseCase.execute(data);
      return {
        ...optimizedData,
        coverLetter,
      };
    } catch (error) {
      console.error('Cover letter generation failed, continuing without it:', error);
      // Return optimized data even if cover letter generation fails
      return optimizedData;
    }
  }

  async exportToWord(data: ResumeData): Promise<void> {
    return await this.exportUseCase.executeWordExport(data);
  }

  async exportToPDF(data: ResumeData): Promise<void> {
    return await this.exportUseCase.executePDFExport(data);
  }

  async exportCoverLetterToWord(data: ResumeData): Promise<void> {
    if (!data.coverLetter) {
      throw new Error('Cover letter not available');
    }
    const exporter = this.exportUseCase['resumeExporter'] as IResumeExporter;
    if (exporter.exportCoverLetterToWord) {
      return await exporter.exportCoverLetterToWord(data);
    }
    throw new Error('Cover letter export not supported');
  }

  mergeOptimizedData(
    originalData: ResumeData,
    optimizedData: OptimizedResumeData
  ): ResumeData {
    return {
      ...originalData,
      summary: optimizedData.summary || originalData.summary,
      skills: optimizedData.skills || originalData.skills,
      coverLetter: optimizedData.coverLetter || originalData.coverLetter,
      experience: originalData.experience.length > 0
        ? originalData.experience.map(exp => {
            const refinedExp = optimizedData.experience?.find(e => e.id === exp.id);
            return refinedExp
              ? { ...exp, refinedBullets: refinedExp.refinedBullets }
              : exp;
          })
        : [], // Return empty array if no experience (for students)
    };
  }
}

