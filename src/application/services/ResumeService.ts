// Application Service - Orchestrates use cases

import { ResumeData, OptimizedResumeData } from '../../domain/entities/Resume';
import { OptimizeResumeUseCase, IResumeOptimizer } from '../../domain/usecases/OptimizeResumeUseCase';
import { ExportResumeUseCase, IResumeExporter } from '../../domain/usecases/ExportResumeUseCase';
import { GenerateCoverLetterUseCase, ICoverLetterGenerator } from '../../domain/usecases/GenerateCoverLetterUseCase';
import { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';

export class ResumeService {
  private optimizeUseCase: OptimizeResumeUseCase;
  private exportUseCase: ExportResumeUseCase;
  private coverLetterUseCase: GenerateCoverLetterUseCase;

  constructor(
    resumeOptimizer: IResumeOptimizer,
    resumeExporter: IResumeExporter,
    coverLetterGenerator: ICoverLetterGenerator,
    private repository: IResumeRepository,
    private profileRepository?: IProfileRepository
  ) {
    this.optimizeUseCase = new OptimizeResumeUseCase(resumeOptimizer);
    this.exportUseCase = new ExportResumeUseCase(resumeExporter);
    this.coverLetterUseCase = new GenerateCoverLetterUseCase(coverLetterGenerator);
  }

  saveDraft(data: ResumeData): void {
    this.repository.save(data);
  }

  loadDraft(): ResumeData | null {
    return this.repository.load();
  }

  async saveGeneratedResume(userId: string, data: ResumeData, title: string): Promise<string> {
    return this.repository.saveGeneratedResume(userId, data, title);
  }

  async updateGeneratedResume(id: string, data: ResumeData, title: string): Promise<void> {
    return this.repository.updateGeneratedResume(id, data, title);
  }

  async getGeneratedResumes(userId: string): Promise<{ id: string; title: string; date: string; updatedAt?: string; company?: string }[]> {
    return this.repository.getGeneratedResumes(userId);
  }

  async getGeneratedResume(id: string): Promise<ResumeData | null> {
    return this.repository.getGeneratedResume(id);
  }

  async deleteGeneratedResume(id: string): Promise<void> {
    return this.repository.deleteGeneratedResume(id);
  }

  async optimizeResume(data: ResumeData): Promise<OptimizedResumeData> {
    const optimizedData = await this.optimizeUseCase.execute(data);

    // Merge optimized content back so the cover letter generator sees the
    // AI-polished summary and refined bullets (stronger source material than raw user input).
    const mergedForCoverLetter = this.mergeOptimizedData(data, optimizedData);

    try {
      const coverLetter = await this.coverLetterUseCase.execute(mergedForCoverLetter);
      return {
        ...optimizedData,
        coverLetter,
      };
    } catch (error) {
      console.error('Cover letter generation failed, continuing without it:', error);
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

  async exportCoverLetterToPDF(data: ResumeData): Promise<void> {
    if (!data.coverLetter) {
      throw new Error('Cover letter not available');
    }
    const exporter = this.exportUseCase['resumeExporter'] as IResumeExporter;
    if (exporter.exportCoverLetterToPDF) {
      return await exporter.exportCoverLetterToPDF(data);
    }
    throw new Error('Cover letter PDF export not supported');
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
      projects: originalData.projects.length > 0
        ? originalData.projects.map(proj => {
          const refined = optimizedData.projects?.find(p => p.id === proj.id);
          return refined ? { ...proj, refinedBullets: refined.refinedBullets } : proj;
        })
        : [],
      extracurriculars: originalData.extracurriculars && originalData.extracurriculars.length > 0
        ? originalData.extracurriculars.map(extra => {
          const refined = optimizedData.extracurriculars?.find(e => e.id === extra.id);
          return refined ? { ...extra, refinedBullets: refined.refinedBullets } : extra;
        })
        : [],
    };
  }

  // ================================
  // General Resume Generation
  // ================================

  static readonly GENERAL_RESUME_TITLE = 'General Resume';

  async hasGeneralResume(userId: string): Promise<boolean> {
    const resumes = await this.repository.getGeneratedResumes(userId);
    return resumes.some(r => r.title === ResumeService.GENERAL_RESUME_TITLE);
  }

  /**
   * Returns info about the general resume including cooldown status.
   * Returns null if no general resume exists.
   */
  async getGeneralResumeInfo(userId: string): Promise<{ id: string; canRegenerate: boolean; cooldownEndsAt: Date | null } | null> {
    const resumes = await this.repository.getGeneratedResumes(userId);
    const generalResume = resumes.find(r => r.title === ResumeService.GENERAL_RESUME_TITLE);
    if (!generalResume) return null;

    const lastUpdated = new Date(generalResume.updatedAt || generalResume.date);
    const cooldownEnd = new Date(lastUpdated.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const canRegenerate = now >= cooldownEnd;

    return {
      id: generalResume.id,
      canRegenerate,
      cooldownEndsAt: canRegenerate ? null : cooldownEnd,
    };
  }

  async generateGeneralResume(userId: string): Promise<string> {
    if (!this.profileRepository) {
      throw new Error('Profile repository is required for general resume generation');
    }

    // Check if general resume already exists
    const exists = await this.hasGeneralResume(userId);
    if (exists) {
      throw new Error('A General Resume already exists. You can only generate one.');
    }

    // Load all profile data
    const [profile, uType, exps, projs, skls, edus, extras, awds, certs, affs, pubs] = await Promise.all([
      this.profileRepository.getProfile(userId),
      this.profileRepository.getUserType(userId),
      this.profileRepository.getExperiences(userId),
      this.profileRepository.getProjects(userId),
      this.profileRepository.getSkills(userId),
      this.profileRepository.getEducations(userId),
      this.profileRepository.getExtracurriculars(userId),
      this.profileRepository.getAwards(userId),
      this.profileRepository.getCertifications(userId),
      this.profileRepository.getAffiliations(userId),
      this.profileRepository.getPublications(userId),
    ]);

    // Determine visible sections based on user type and available data
    const visibleSections: string[] = ['skills', 'education', 'projects'];
    if (uType === 'experienced') visibleSections.push('experience');
    if (uType === 'student') visibleSections.push('extracurriculars');
    if (extras.length > 0 && !visibleSections.includes('extracurriculars')) visibleSections.push('extracurriculars');
    if (awds.length > 0) visibleSections.push('awards');
    if (certs.length > 0) visibleSections.push('certifications');
    if (affs.length > 0) visibleSections.push('affiliations');
    if (pubs.length > 0) visibleSections.push('publications');

    // Assemble ResumeData with a generic target job
    const resumeData: ResumeData = {
      userType: uType || undefined,
      targetJob: {
        title: 'General Purpose Resume',
        company: '',
        description: 'Create a strong, general-purpose professional resume that highlights the candidate\'s key strengths, experiences, and skills. Focus on versatility and broad appeal to multiple industries and roles. Emphasize transferable skills, measurable achievements, and professional growth.',
      },
      personalInfo: profile || { fullName: '', email: '', phone: '', location: '' },
      summary: '',
      experience: exps,
      projects: projs,
      skills: skls,
      education: edus,
      extracurriculars: extras,
      awards: awds,
      certifications: certs,
      affiliations: affs,
      publications: pubs,
      visibleSections: Array.from(new Set(visibleSections)),
      template: 'ats-classic',
    };

    // Optimize via AI
    const optimizedData = await this.optimizeResume(resumeData);
    const mergedData = this.mergeOptimizedData(resumeData, optimizedData);

    // Save and return ID
    const id = await this.saveGeneratedResume(userId, mergedData, ResumeService.GENERAL_RESUME_TITLE);
    return id;
  }

  /**
   * Regenerate the General Resume from updated profile data.
   * Enforces a 24-hour cooldown between regenerations.
   */
  async regenerateGeneralResume(userId: string, existingResumeId: string): Promise<ResumeData> {
    if (!this.profileRepository) {
      throw new Error('Profile repository is required for general resume regeneration');
    }

    // Check cooldown
    const info = await this.getGeneralResumeInfo(userId);
    if (info && !info.canRegenerate && info.cooldownEndsAt) {
      const hoursLeft = Math.ceil((info.cooldownEndsAt.getTime() - Date.now()) / (1000 * 60 * 60));
      throw new Error(`General Resume can only be regenerated once every 24 hours. Try again in ~${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`);
    }

    // Load fresh profile data
    const [profile, uType, exps, projs, skls, edus, extras, awds, certs, affs, pubs] = await Promise.all([
      this.profileRepository.getProfile(userId),
      this.profileRepository.getUserType(userId),
      this.profileRepository.getExperiences(userId),
      this.profileRepository.getProjects(userId),
      this.profileRepository.getSkills(userId),
      this.profileRepository.getEducations(userId),
      this.profileRepository.getExtracurriculars(userId),
      this.profileRepository.getAwards(userId),
      this.profileRepository.getCertifications(userId),
      this.profileRepository.getAffiliations(userId),
      this.profileRepository.getPublications(userId),
    ]);

    // Determine visible sections
    const visibleSections: string[] = ['skills', 'education', 'projects'];
    if (uType === 'experienced') visibleSections.push('experience');
    if (uType === 'student') visibleSections.push('extracurriculars');
    if (extras.length > 0 && !visibleSections.includes('extracurriculars')) visibleSections.push('extracurriculars');
    if (awds.length > 0) visibleSections.push('awards');
    if (certs.length > 0) visibleSections.push('certifications');
    if (affs.length > 0) visibleSections.push('affiliations');
    if (pubs.length > 0) visibleSections.push('publications');

    // Assemble fresh ResumeData
    const resumeData: ResumeData = {
      userType: uType || undefined,
      targetJob: {
        title: 'General Purpose Resume',
        company: '',
        description: 'Create a strong, general-purpose professional resume that highlights the candidate\'s key strengths, experiences, and skills. Focus on versatility and broad appeal to multiple industries and roles. Emphasize transferable skills, measurable achievements, and professional growth.',
      },
      personalInfo: profile || { fullName: '', email: '', phone: '', location: '' },
      summary: '',
      experience: exps,
      projects: projs,
      skills: skls,
      education: edus,
      extracurriculars: extras,
      awards: awds,
      certifications: certs,
      affiliations: affs,
      publications: pubs,
      visibleSections: Array.from(new Set(visibleSections)),
      template: 'ats-classic',
    };

    // Optimize via AI
    const optimizedData = await this.optimizeResume(resumeData);
    const mergedData = this.mergeOptimizedData(resumeData, optimizedData);

    // Update existing resume
    await this.updateGeneratedResume(existingResumeId, mergedData, ResumeService.GENERAL_RESUME_TITLE);
    return mergedData;
  }
}

