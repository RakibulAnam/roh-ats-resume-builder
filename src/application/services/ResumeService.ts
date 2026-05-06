// Application Service - Orchestrates use cases

import { ResumeData, OptimizedResumeData, JobToolkit, ToolkitItem, ToolkitErrors } from '../../domain/entities/Resume';
import { OptimizeResumeUseCase, IResumeOptimizer } from '../../domain/usecases/OptimizeResumeUseCase';
import { ExportResumeUseCase, IResumeExporter } from '../../domain/usecases/ExportResumeUseCase';
import { GenerateCoverLetterUseCase, ICoverLetterGenerator } from '../../domain/usecases/GenerateCoverLetterUseCase';
import { GenerateOutreachEmailUseCase, IOutreachEmailGenerator } from '../../domain/usecases/GenerateOutreachEmailUseCase';
import { GenerateLinkedInMessageUseCase, ILinkedInMessageGenerator } from '../../domain/usecases/GenerateLinkedInMessageUseCase';
import { GenerateInterviewQuestionsUseCase, IInterviewQuestionsGenerator } from '../../domain/usecases/GenerateInterviewQuestionsUseCase';
import { GenerateToolkitUseCase, IToolkitGenerator } from '../../domain/usecases/GenerateToolkitUseCase';
import { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { assertNotGibberish, FieldCheck } from '../validation/gibberishDetector';

export class ResumeService {
  private optimizeUseCase: OptimizeResumeUseCase;
  private generalOptimizeUseCase: OptimizeResumeUseCase;
  private exportUseCase: ExportResumeUseCase;
  private coverLetterUseCase: GenerateCoverLetterUseCase;
  private outreachEmailUseCase: GenerateOutreachEmailUseCase;
  private linkedInMessageUseCase: GenerateLinkedInMessageUseCase;
  private interviewQuestionsUseCase: GenerateInterviewQuestionsUseCase;
  private toolkitUseCase: GenerateToolkitUseCase;

  constructor(
    resumeOptimizer: IResumeOptimizer,
    resumeExporter: IResumeExporter,
    coverLetterGenerator: ICoverLetterGenerator,
    outreachEmailGenerator: IOutreachEmailGenerator,
    linkedInMessageGenerator: ILinkedInMessageGenerator,
    interviewQuestionsGenerator: IInterviewQuestionsGenerator,
    toolkitGenerator: IToolkitGenerator,
    private repository: IResumeRepository,
    private profileRepository?: IProfileRepository,
    generalResumeOptimizer?: IResumeOptimizer
  ) {
    this.optimizeUseCase = new OptimizeResumeUseCase(resumeOptimizer);
    // Falls back to the regular optimizer if no dedicated general-resume
    // optimizer is wired (e.g. in local dev without the new endpoint).
    this.generalOptimizeUseCase = new OptimizeResumeUseCase(generalResumeOptimizer ?? resumeOptimizer);
    this.exportUseCase = new ExportResumeUseCase(resumeExporter);
    this.coverLetterUseCase = new GenerateCoverLetterUseCase(coverLetterGenerator);
    this.outreachEmailUseCase = new GenerateOutreachEmailUseCase(outreachEmailGenerator);
    this.linkedInMessageUseCase = new GenerateLinkedInMessageUseCase(linkedInMessageGenerator);
    this.interviewQuestionsUseCase = new GenerateInterviewQuestionsUseCase(interviewQuestionsGenerator);
    this.toolkitUseCase = new GenerateToolkitUseCase(toolkitGenerator);
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
    // Pre-flight gate: refuse to spend tokens on keyboard mashing. Throws a
    // GibberishContentError listing the offending fields so the UI can show a
    // meaningful message. We only check the long, free-form fields the user
    // typed themselves — short structured fields (names, dates, locations)
    // are too noisy to score and not where waste comes from.
    this.assertContentIsReal(data);

    // Two concurrent Gemini calls instead of five — the optimizer refines the
    // resume itself while the combined toolkit generator produces cover
    // letter + outreach email + LinkedIn note + interview questions in one
    // shot. Keeping them independent means the user still gets a tailored
    // resume even if the toolkit call fails (and vice versa), and they share
    // the same raw input, so the toolkit doesn't need the refined bullets.
    const [optimizeResult, toolkitResult] = await Promise.allSettled([
      this.optimizeUseCase.execute(data),
      this.withRetry(() => this.toolkitUseCase.execute(data)),
    ]);

    // Optimizer is the core artifact — if it failed, the whole flow failed
    // and we surface the error to the caller the same way as before.
    if (optimizeResult.status === 'rejected') {
      throw optimizeResult.reason instanceof Error
        ? optimizeResult.reason
        : new Error(this.errorMessage(optimizeResult.reason));
    }

    const optimizedData = optimizeResult.value;
    const toolkit: JobToolkit = {};
    let coverLetter: string | undefined;

    if (toolkitResult.status === 'fulfilled' && toolkitResult.value) {
      coverLetter = toolkitResult.value.coverLetter;
      toolkit.outreachEmail = toolkitResult.value.outreachEmail;
      toolkit.linkedInMessage = toolkitResult.value.linkedInMessage;
      toolkit.interviewQuestions = toolkitResult.value.interviewQuestions;
    } else {
      // One failure = all four items failed, since they came from the same
      // call. Record the same error under each key so the UI can render
      // "failed" cards for each and the user can retry any one of them
      // individually (a single-item retry hits a single-item generator, so
      // a rate-limit blip on the combined call doesn't force a full re-run).
      const reason =
        toolkitResult.status === 'rejected' ? toolkitResult.reason : 'Generator returned no data';
      const friendlyMessage = this.errorMessage(reason);
      console.error('Toolkit generation failed:', reason);
      toolkit.errors = {
        coverLetter: friendlyMessage,
        outreachEmail: friendlyMessage,
        linkedInMessage: friendlyMessage,
        interviewQuestions: friendlyMessage,
      };
    }

    return {
      ...optimizedData,
      coverLetter,
      // Always return a toolkit object once generation has been attempted, so
      // failures are visible in the UI rather than silently collapsing into
      // "nothing generated".
      toolkit,
    };
  }

  /**
   * Regenerate a single toolkit item for an already-optimized resume. Returns
   * an updated ResumeData with the new value on success, or with an error
   * message recorded on failure. When a resumeId is supplied, the change is
   * also persisted via the repository so subsequent reloads see it.
   *
   * Never throws for AI failures — the failure is captured on `toolkit.errors`
   * so the UI can render the "failed" state. Throws only for persistence
   * failures, which callers may surface as a toast.
   */
  async regenerateToolkitItem(
    userId: string | null,
    resumeId: string | null,
    data: ResumeData,
    item: ToolkitItem,
  ): Promise<ResumeData> {
    const nextToolkit: JobToolkit = { ...(data.toolkit ?? {}) };
    const nextErrors: ToolkitErrors = { ...(nextToolkit.errors ?? {}) };
    const next: ResumeData = { ...data, toolkit: nextToolkit };

    try {
      if (item === 'coverLetter') {
        const v = await this.withRetry(() => this.coverLetterUseCase.execute(data));
        if (!v) throw new Error('Generator returned an empty cover letter');
        next.coverLetter = v;
      } else if (item === 'outreachEmail') {
        const v = await this.withRetry(() => this.outreachEmailUseCase.execute(data));
        if (!v?.subject || !v?.body) throw new Error('Generator returned an empty outreach email');
        nextToolkit.outreachEmail = v;
      } else if (item === 'linkedInMessage') {
        const v = await this.withRetry(() => this.linkedInMessageUseCase.execute(data));
        if (!v) throw new Error('Generator returned an empty LinkedIn note');
        nextToolkit.linkedInMessage = v;
      } else if (item === 'interviewQuestions') {
        const v = await this.withRetry(() => this.interviewQuestionsUseCase.execute(data));
        if (!v?.length) throw new Error('Generator returned no interview questions');
        nextToolkit.interviewQuestions = v;
      }
      delete nextErrors[item];
    } catch (err) {
      nextErrors[item] = this.errorMessage(err);
      console.error(`Regeneration of ${item} failed:`, err);
    }

    nextToolkit.errors = Object.keys(nextErrors).length > 0 ? nextErrors : undefined;

    if (userId && resumeId) {
      try {
        const title = next.targetJob?.title
          ? `${next.targetJob.title} Resume`
          : `Resume - ${new Date().toLocaleDateString()}`;
        await this.repository.updateGeneratedResume(resumeId, next, title);
      } catch (persistErr) {
        console.error('Persisting regenerated toolkit item failed:', persistErr);
        throw persistErr instanceof Error
          ? persistErr
          : new Error('Failed to save the regenerated item');
      }
    }

    return next;
  }

  // Retry transient failures (rate limits, timeouts, network blips). One extra
  // attempt with a short backoff is enough in practice — persistent errors
  // surface via `toolkit.errors` for the user to retry from the Preview.
  private async withRetry<T>(fn: () => Promise<T>, attempts = 1, delayMs = 1200): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i <= attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (i < attempts) {
          await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
        }
      }
    }
    throw lastErr;
  }

  // Build the field list for the gibberish gate. Pulls out the long
  // free-form fields where users brain-dump (and where keyboard mashing
  // would burn the most tokens). Friendly labels are used so the surfaced
  // error message reads naturally in the UI.
  private assertContentIsReal(data: ResumeData): void {
    const checks: FieldCheck[] = [
      { field: 'Job title', text: data.targetJob?.title },
      { field: 'Job description', text: data.targetJob?.description },
      { field: 'Summary', text: data.summary },
    ];
    (data.experience || []).forEach((exp, i) => {
      const label = exp.role || exp.company || `Experience ${i + 1}`;
      checks.push({ field: `${label} — what you did`, text: exp.rawDescription });
    });
    (data.projects || []).forEach((proj, i) => {
      const label = proj.name || `Project ${i + 1}`;
      checks.push({ field: `${label} — description`, text: proj.rawDescription });
    });
    (data.extracurriculars || []).forEach((extra, i) => {
      const label = extra.title || extra.organization || `Activity ${i + 1}`;
      checks.push({ field: `${label} — description`, text: extra.description });
    });
    assertNotGibberish(checks);
  }

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown error';
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
      toolkit: optimizedData.toolkit || originalData.toolkit,
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
    const [profile, uType, exps, projs, skls, edus, extras, awds, certs, affs, pubs, langs, refs] = await Promise.all([
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
      this.profileRepository.getLanguages(userId),
      this.profileRepository.getReferences(userId),
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
    if (langs.length > 0) visibleSections.push('languages');
    if (refs.length > 0) visibleSections.push('references');

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
      languages: langs,
      references: refs,
      visibleSections: Array.from(new Set(visibleSections)),
      template: 'ats-classic',
    };

    // Pre-flight gibberish gate — same one the paid path uses. Profile data
    // can still contain keyboard-mashing in long-form fields (experience /
    // project / activity descriptions) and we shouldn't spend AI tokens on it.
    this.assertContentIsReal(resumeData);

    // Optimize via the free general-resume path (no credit gate, no toolkit).
    const optimizedData = await this.generalOptimizeUseCase.execute(resumeData);
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
    const [profile, uType, exps, projs, skls, edus, extras, awds, certs, affs, pubs, langs, refs] = await Promise.all([
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
      this.profileRepository.getLanguages(userId),
      this.profileRepository.getReferences(userId),
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
    if (langs.length > 0) visibleSections.push('languages');
    if (refs.length > 0) visibleSections.push('references');

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
      languages: langs,
      references: refs,
      visibleSections: Array.from(new Set(visibleSections)),
      template: 'ats-classic',
    };

    // Pre-flight gibberish gate — same as the initial general-resume path.
    this.assertContentIsReal(resumeData);

    // Optimize via the free general-resume path (no credit gate, no toolkit).
    const optimizedData = await this.generalOptimizeUseCase.execute(resumeData);
    const mergedData = this.mergeOptimizedData(resumeData, optimizedData);

    // Update existing resume
    await this.updateGeneratedResume(existingResumeId, mergedData, ResumeService.GENERAL_RESUME_TITLE);
    return mergedData;
  }
}

