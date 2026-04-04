import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ResumeData, AppStep } from '../domain/entities';
import {
  UserTypeStep,
  TargetJobStep,
  PersonalInfoStep,
  ExperienceStep,
  ProjectsStep,
  EducationStep,
  SkillsStep,
  ExtracurricularStep,
  AwardsStep,
  CertificationsStep,
  AffiliationsStep,
  PublicationsStep,
  SectionSelectionStep,
} from './components/FormSteps';
import { Preview } from './components/Preview';
import { ResumeService } from '../application/services/ResumeService';
import { useAuth } from '../infrastructure/auth/AuthContext';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Navbar } from './components/Layout/Navbar';
import { BuilderStepper } from './components/Builder/BuilderStepper';

const STEPS_INFO = [
  { id: AppStep.USER_TYPE, title: 'User Type' },
  { id: AppStep.SECTIONS, title: 'Sections' },
  { id: AppStep.TARGET_JOB, title: 'Target Job' },
  { id: AppStep.PERSONAL_INFO, title: 'Personal Info' },
  { id: AppStep.EXPERIENCE, title: 'Experience' },
  { id: AppStep.PROJECTS, title: 'Projects' },
  { id: AppStep.EDUCATION, title: 'Education' },
  { id: AppStep.SKILLS, title: 'Skills' },
  { id: AppStep.EXTRACURRICULARS, title: 'Activities' },
  { id: AppStep.AWARDS, title: 'Awards' },
  { id: AppStep.CERTIFICATIONS, title: 'Certifications' },
  { id: AppStep.AFFILIATIONS, title: 'Affiliations' },
  { id: AppStep.PUBLICATIONS, title: 'Publications' },
];

const DEFAULT_SECTIONS = [
  'experience', 'education', 'projects', 'skills',
  'extracurriculars', 'awards', 'certifications', 'affiliations', 'publications'
];

export const getVisibleSteps = (userType?: 'experienced' | 'student', visibleSections?: string[]) => {
  const baseSteps = [AppStep.SECTIONS, AppStep.TARGET_JOB, AppStep.PERSONAL_INFO];
  const stepsToShow = userType ? baseSteps : [AppStep.USER_TYPE, ...baseSteps];

  const sectionMap: Record<string, AppStep> = {
    'experience': AppStep.EXPERIENCE,
    'projects': AppStep.PROJECTS,
    'education': AppStep.EDUCATION,
    'skills': AppStep.SKILLS,
    'extracurriculars': AppStep.EXTRACURRICULARS,
    'awards': AppStep.AWARDS,
    'certifications': AppStep.CERTIFICATIONS,
    'affiliations': AppStep.AFFILIATIONS,
    'publications': AppStep.PUBLICATIONS,
  };

  return STEPS_INFO.filter(s => {
    if (stepsToShow.includes(s.id)) return true;
    const sectionKey = Object.keys(sectionMap).find(key => sectionMap[key] === s.id);

    if (sectionKey) {
      if (visibleSections && visibleSections.length > 0) {
        return visibleSections.includes(sectionKey);
      }
      if (!userType) return false;
      if (userType === 'student') {
        if ([AppStep.EXPERIENCE, AppStep.CERTIFICATIONS, AppStep.AFFILIATIONS, AppStep.PUBLICATIONS].includes(s.id)) return false;
      }
      if (userType === 'experienced') {
        if ([AppStep.EXTRACURRICULARS, AppStep.AWARDS].includes(s.id)) return false;
      }
      return true;
    }
    return false;
  });
};

interface BuilderScreenProps {
  initialData: ResumeData;
  initialStep: AppStep;
  currentResumeId: string | null;
  resumeService: ResumeService | null;
  onExit: () => void;
}

export const BuilderScreen: React.FC<BuilderScreenProps> = ({
  initialData,
  initialStep,
  currentResumeId,
  resumeService,
  onExit,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<AppStep>(initialStep);
  const [resumeData, setResumeData] = useState<ResumeData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Validation errors map field paths (e.g. "personalInfo.fullName") to error messages
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isGeneralResume, setIsGeneralResume] = useState(false);
  const [canRegenerate, setCanRegenerate] = useState(true);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<Date | null>(null);

  useEffect(() => {
    const checkResumeStatus = async () => {
      if (!user || !resumeService || !currentResumeId) return;
      const resumes = await resumeService.getGeneratedResumes(user.id);
      const current = resumes.find(r => r.id === currentResumeId);
      
      const isGeneral = current?.title === ResumeService.GENERAL_RESUME_TITLE;
      setIsGeneralResume(isGeneral);

      if (isGeneral) {
        const info = await resumeService.getGeneralResumeInfo(user.id);
        if (info) {
          setCanRegenerate(info.canRegenerate);
          setCooldownEndsAt(info.cooldownEndsAt);
        }
      }
    };
    checkResumeStatus();
  }, [user, resumeService, currentResumeId]);

  const handleRegenerateGeneralResume = async () => {
      if (!user || !resumeService || !currentResumeId) return;
      try {
        const newData = await resumeService.regenerateGeneralResume(user.id, currentResumeId);
        setResumeData(newData);
        toast.success('General Resume regenerated successfully!');
        
        // update cooldown logic
        const info = await resumeService.getGeneralResumeInfo(user.id);
        if (info) {
          setCanRegenerate(info.canRegenerate);
          setCooldownEndsAt(info.cooldownEndsAt);
        }
      } catch (error) {
         toast.error(error instanceof Error ? error.message : 'Failed to regenerate resume');
      }
  };

  const validateStep = (currentStepId: AppStep, showToast = true): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    switch (currentStepId) {
      case AppStep.PERSONAL_INFO:
        if (!(resumeData.personalInfo.fullName || '').trim()) {
          newErrors['personalInfo.fullName'] = 'Please enter your full name';
          isValid = false;
        }
        if (!(resumeData.personalInfo.email || '').trim()) {
          newErrors['personalInfo.email'] = 'Please enter your email';
          isValid = false;
        }
        break;

      case AppStep.EXPERIENCE:
        if (resumeData.userType === 'experienced' && resumeData.experience.length === 0) {
          if (showToast) toast.error('Please add at least one work experience');
          isValid = false;
        }
        resumeData.experience.forEach((exp, index) => {
          if (!(exp.company || '').trim()) {
            newErrors[`experience.${index}.company`] = 'Company is required';
            isValid = false;
          }
          if (!(exp.role || '').trim()) {
            newErrors[`experience.${index}.role`] = 'Role is required';
            isValid = false;
          }
          if (!(exp.startDate || '').trim()) {
            newErrors[`experience.${index}.startDate`] = 'Start Date is required';
            isValid = false;
          }
          if (!exp.isCurrent && !(exp.endDate || '').trim()) {
            newErrors[`experience.${index}.endDate`] = 'End Date is required';
            isValid = false;
          }
          if (!(exp.rawDescription || '').trim()) {
            newErrors[`experience.${index}.rawDescription`] = 'Description is required';
            isValid = false;
          }
        });
        break;

      case AppStep.PROJECTS:
        if (resumeData.userType === 'student' && resumeData.projects.length === 0) {
          if (showToast) toast.error('Please add at least one project');
          isValid = false;
        }
        resumeData.projects.forEach((proj, index) => {
          if (!(proj.name || '').trim()) {
            newErrors[`projects.${index}.name`] = 'Project Name is required';
            isValid = false;
          }
          if (!(proj.technologies || '').trim()) {
            newErrors[`projects.${index}.technologies`] = 'Technologies are required';
            isValid = false;
          }
          if (!(proj.rawDescription || '').trim()) {
            newErrors[`projects.${index}.rawDescription`] = 'Description is required';
            isValid = false;
          }
        });
        break;

      case AppStep.EDUCATION:
        resumeData.education.forEach((edu, index) => {
          if (!(edu.school || '').trim()) {
            newErrors[`education.${index}.school`] = 'School is required';
            isValid = false;
          }
          if (!(edu.degree || '').trim()) {
            newErrors[`education.${index}.degree`] = 'Degree is required';
            isValid = false;
          }
          if (!(edu.field || '').trim()) {
            newErrors[`education.${index}.field`] = 'Field of Study is required';
            isValid = false;
          }
          if (!(edu.startDate || '').trim()) {
            newErrors[`education.${index}.startDate`] = 'Start Year is required';
            isValid = false;
          }
          if (!edu.isCurrent && !(edu.endDate || '').trim()) {
            newErrors[`education.${index}.endDate`] = 'End Year is required';
            isValid = false;
          }
        });
        break;

      case AppStep.SKILLS:
        if (resumeData.skills.length === 0) {
          if (showToast) toast.error('Please add at least one skill');
          isValid = false;
        }
        break;

      case AppStep.EXTRACURRICULARS:
        resumeData.extracurriculars?.forEach((item, index) => {
          if (!(item.title || '').trim()) {
            newErrors[`extracurriculars.${index}.title`] = 'Role is required';
            isValid = false;
          }
          if (!(item.organization || '').trim()) {
            newErrors[`extracurriculars.${index}.organization`] = 'Organization is required';
            isValid = false;
          }
          if (!(item.startDate || '').trim()) {
            newErrors[`extracurriculars.${index}.startDate`] = 'Start Date is required';
            isValid = false;
          }
          if (!(item.endDate || '').trim()) {
            newErrors[`extracurriculars.${index}.endDate`] = 'End Date is required';
            isValid = false;
          }
        });
        break;

      case AppStep.AWARDS:
        resumeData.awards?.forEach((item, index) => {
          if (!(item.title || '').trim()) {
            newErrors[`awards.${index}.title`] = 'Award Title is required';
            isValid = false;
          }
          if (!(item.issuer || '').trim()) {
            newErrors[`awards.${index}.issuer`] = 'Issuer is required';
            isValid = false;
          }
          if (!(item.date || '').trim()) {
            newErrors[`awards.${index}.date`] = 'Date is required';
            isValid = false;
          }
        });
        break;

      case AppStep.CERTIFICATIONS:
        resumeData.certifications?.forEach((item, index) => {
          if (!(item.name || '').trim()) {
            newErrors[`certifications.${index}.name`] = 'Certification Name is required';
            isValid = false;
          }
          if (!(item.issuer || '').trim()) {
            newErrors[`certifications.${index}.issuer`] = 'Issuer is required';
            isValid = false;
          }
          if (!(item.date || '').trim()) {
            newErrors[`certifications.${index}.date`] = 'Date is required';
            isValid = false;
          }
        });
        break;

      case AppStep.AFFILIATIONS:
        resumeData.affiliations?.forEach((item, index) => {
          if (!(item.organization || '').trim()) {
            newErrors[`affiliations.${index}.organization`] = 'Organization is required';
            isValid = false;
          }
          if (!(item.role || '').trim()) {
            newErrors[`affiliations.${index}.role`] = 'Role is required';
            isValid = false;
          }
          if (!(item.startDate || '').trim()) {
            newErrors[`affiliations.${index}.startDate`] = 'Start Date is required';
            isValid = false;
          }
          if (!(item.endDate || '').trim()) {
            newErrors[`affiliations.${index}.endDate`] = 'End Date is required';
            isValid = false;
          }
        });
        break;

      case AppStep.PUBLICATIONS:
        resumeData.publications?.forEach((item, index) => {
          if (!(item.title || '').trim()) {
            newErrors[`publications.${index}.title`] = 'Title is required';
            isValid = false;
          }
          if (!(item.publisher || '').trim()) {
            newErrors[`publications.${index}.publisher`] = 'Publisher is required';
            isValid = false;
          }
          if (!(item.date || '').trim()) {
            newErrors[`publications.${index}.date`] = 'Date is required';
            isValid = false;
          }
        });
        break;

      default:
        break;
    }

    setErrors(newErrors);
    
    // Only show generic toast if there's no specific field error preventing the toast
    if (!isValid && showToast && Object.keys(newErrors).length > 0 && currentStepId === AppStep.PERSONAL_INFO) {
      toast.error('Please fix the highlighted fields.');
    } else if (!isValid && showToast && currentStepId !== AppStep.PERSONAL_INFO) {
      toast.error('Please fill in all required fields properly.');
    }
    
    return isValid;
  };

  const handleNext = () => {
    if (!validateStep(step, true)) {
      return;
    }
    setErrors({}); // clear on success

    if (step === AppStep.USER_TYPE && (!resumeData.visibleSections || resumeData.visibleSections.length === 0)) {
      const defaults = ['education', 'skills', 'projects'];
      if (resumeData.userType === 'experienced') defaults.push('experience');
      setResumeData(prev => ({ ...prev, visibleSections: defaults }));
    }

    const visibleSteps = getVisibleSteps(resumeData.userType, resumeData.visibleSections);
    const currentIndex = visibleSteps.findIndex(s => s.id === step);

    if (currentIndex < visibleSteps.length - 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep(visibleSteps[currentIndex + 1].id);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setErrors({});
    
    const visibleSteps = getVisibleSteps(resumeData.userType, resumeData.visibleSections);
    const currentIndex = visibleSteps.findIndex(s => s.id === step);

    if (currentIndex > 0) {
      setStep(visibleSteps[currentIndex - 1].id);
    } else if (step === AppStep.PREVIEW) {
      setStep(visibleSteps[visibleSteps.length - 1].id);
    }
  };

  const handleGenerate = async () => {
    if (!resumeService) {
      toast.error('Service not initialized. Please refresh the page.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    try {
      const optimizedData = await resumeService.optimizeResume(resumeData);
      const mergedData = resumeService.mergeOptimizedData(resumeData, optimizedData);
      setResumeData(mergedData);
      setStep(AppStep.PREVIEW);
      toast.success('Resume generated successfully!');

      if (user) {
        try {
          const title = mergedData.targetJob?.title
            ? `${mergedData.targetJob.title} Resume`
            : `Resume - ${new Date().toLocaleDateString()}`;
          await resumeService.saveGeneratedResume(user.id, mergedData, title);
        } catch (saveErr) {
          console.error('Auto-save failed', saveErr);
        }
      }
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to generate resume. Please check your internet connection or API key and try again.';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportWord = async (data: ResumeData) => {
    if (!resumeService) throw new Error('Service not initialized');
    await resumeService.exportToWord(data);
  };

  const handleExportCoverLetter = async (data: ResumeData) => {
    if (!resumeService) throw new Error('Service not initialized');
    await resumeService.exportCoverLetterToWord(data);
  };

  if (step === AppStep.PREVIEW) {
    return (
      <Preview
        data={resumeData}
        onUpdate={setResumeData}
        onGoHome={onExit}
        onExportWord={handleExportWord}
        onExportCoverLetter={handleExportCoverLetter}
        readOnly={!!currentResumeId && step === AppStep.PREVIEW}
        isGeneralResume={isGeneralResume}
        canRegenerate={canRegenerate}
        cooldownEndsAt={cooldownEndsAt}
        onRegenerate={handleRegenerateGeneralResume}
      />
    );
  }

  const visibleSteps = getVisibleSteps(resumeData.userType, resumeData.visibleSections);
  const isLastStep = visibleSteps.length > 0 && visibleSteps[visibleSteps.length - 1].id === step;

  return (
    <div className="min-h-screen bg-charcoal-50 flex flex-col">
      <Navbar onDashboardClick={onExit} showExitBuilder={true} />
      <BuilderStepper steps={visibleSteps} currentStep={step} />

      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-charcoal-100 p-6 md:p-10 min-h-[500px] relative">
          {step === AppStep.USER_TYPE && (
            <UserTypeStep
              userType={resumeData.userType}
              update={userType => setResumeData(prev => ({ ...prev, userType }))}
            />
          )}
          {step === AppStep.SECTIONS && (
            <SectionSelectionStep
              selected={resumeData.visibleSections || []}
              update={sections => setResumeData(prev => ({ ...prev, visibleSections: sections }))}
              userType={resumeData.userType}
            />
          )}
          {step === AppStep.TARGET_JOB && (
            <TargetJobStep
              data={resumeData.targetJob}
              update={d => setResumeData(prev => ({ ...prev, targetJob: d }))}
            />
          )}
          {step === AppStep.PERSONAL_INFO && (
            <PersonalInfoStep
              data={resumeData.personalInfo}
              errors={errors}
              update={d => setResumeData(prev => ({ ...prev, personalInfo: d }))}
            />
          )}
          {step === AppStep.EXPERIENCE && resumeData.userType === 'experienced' && (
            <ExperienceStep
              data={resumeData.experience}
              errors={errors}
              update={d => setResumeData(prev => ({ ...prev, experience: d }))}
            />
          )}
          {step === AppStep.PROJECTS && (
            <ProjectsStep
              data={resumeData.projects}
              errors={errors}
              update={d => setResumeData(prev => ({ ...prev, projects: d }))}
            />
          )}
          {step === AppStep.EDUCATION && (
            <EducationStep
              data={resumeData.education}
              errors={errors}
              update={d => setResumeData(prev => ({ ...prev, education: d }))}
            />
          )}
          {step === AppStep.SKILLS && (
            <SkillsStep
              data={resumeData.skills}
              update={d => setResumeData(prev => ({ ...prev, skills: d }))}
            />
          )}
          {step === AppStep.EXTRACURRICULARS && (
            <ExtracurricularStep
              data={resumeData.extracurriculars || []}
              errors={errors}
              update={d => setResumeData(prev => ({ ...prev, extracurriculars: d }))}
            />
          )}
          {step === AppStep.AWARDS && (
            <AwardsStep
              data={resumeData.awards || []}
              errors={errors}
              update={d => setResumeData(prev => ({ ...prev, awards: d }))}
            />
          )}
          {step === AppStep.CERTIFICATIONS && (
            <CertificationsStep
              data={resumeData.certifications || []}
              errors={errors}
              update={d => setResumeData(prev => ({ ...prev, certifications: d }))}
            />
          )}
          {step === AppStep.AFFILIATIONS && (
            <AffiliationsStep
              data={resumeData.affiliations || []}
              errors={errors}
              update={d => setResumeData(prev => ({ ...prev, affiliations: d }))}
            />
          )}
          {step === AppStep.PUBLICATIONS && (
            <PublicationsStep
              data={resumeData.publications || []}
              errors={errors}
              update={d => setResumeData(prev => ({ ...prev, publications: d }))}
            />
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={24} className="text-brand-600 animate-pulse" />
                </div>
              </div>
              <h3 className="mt-6 text-xl font-bold text-charcoal-800">
                Optimizing Resume…
              </h3>
              <p className="text-charcoal-500 mt-2 text-center max-w-md px-4">
                Our AI is rewriting your bullets to match the job description
                and formatting your document. This takes about 10-15 seconds.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-charcoal-200 p-4 sticky bottom-0 z-10 w-full">
        <div className="max-w-3xl mx-auto flex justify-between items-center px-4 md:px-0">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === AppStep.USER_TYPE || isGenerating}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-colors ${step === AppStep.USER_TYPE
              ? 'opacity-0 cursor-default'
              : 'text-charcoal-600 hover:bg-charcoal-100'
              }`}
          >
            <ChevronLeft size={18} /> Back
          </button>

          <div className="flex flex-col items-end">
            {generationError && (
              <p className="text-red-500 text-xs mb-2 font-medium">
                {generationError}
              </p>
            )}
            {step === AppStep.USER_TYPE ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!resumeData.userType}
                className="flex items-center gap-2 px-8 py-3 bg-charcoal-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors focus-visible:ring-2 focus-visible:ring-charcoal-900 focus-visible:ring-offset-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : isLastStep ? (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:to-brand-800 transition-all focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50 transform active:scale-95"
              >
                {isGenerating ? 'Generating…' : 'Generate Resume'}{' '}
                <Sparkles size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-charcoal-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors focus-visible:ring-2 focus-visible:ring-charcoal-900 focus-visible:ring-offset-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
