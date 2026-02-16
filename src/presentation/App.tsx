import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
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
} from './components/FormSteps';
import { Preview } from './components/Preview';
import { ResumeService } from '../application/services/ResumeService';
import { createResumeService, profileRepository } from '../infrastructure/config/dependencies';
import { AuthProvider, useAuth } from '../infrastructure/auth/AuthContext';
import { LoginScreen } from './LoginScreen';
import { LandingScreen } from './LandingScreen';
import { ChevronRight, ChevronLeft, Sparkles, FileText, Loader2 } from 'lucide-react';

// New Imports
import { Navbar } from './components/Layout/Navbar';
import { BuilderStepper } from './components/Builder/BuilderStepper';
import { DashboardScreen } from './DashboardScreen';
import { ProfileScreen } from './ProfileScreen';
import { ProfileSetupScreen } from './ProfileSetupScreen';
import { ResumeSourceDialog } from './components/ResumeSourceDialog';

const INITIAL_DATA: ResumeData = {
  userType: undefined,
  targetJob: { title: '', company: '', description: '' },
  personalInfo: { fullName: '', email: '', phone: '', location: '' },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: [],
  extracurriculars: [],
  awards: [],
  certifications: [],
  affiliations: [],
  publications: [],
};

const STEPS_INFO = [
  { id: AppStep.USER_TYPE, title: 'User Type' },
  { id: AppStep.SECTIONS, title: 'Sections' }, // Add new step here
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

// Get visible steps
const getVisibleSteps = (userType?: 'experienced' | 'student', visibleSections?: string[]) => {
  // Base steps
  const baseSteps = [AppStep.SECTIONS, AppStep.TARGET_JOB, AppStep.PERSONAL_INFO];

  // Only show User Type if not set (or always show? User asked to remove it).
  // Strategy: If userType is set, start navigation at SECTIONS. User Type step is hidden.
  // To change it, user handles it differently (e.g. clear form).
  const stepsToShow = userType ? baseSteps : [AppStep.USER_TYPE, ...baseSteps];

  // Map section IDs to AppStep
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
    // Show if in our computed base/visible list
    if (stepsToShow.includes(s.id)) return true;

    // Check if step maps to a section
    const sectionKey = Object.keys(sectionMap).find(key => sectionMap[key] === s.id);

    // If it corresponds to a section
    if (sectionKey) {
      // If visibleSections is defined, check directly
      if (visibleSections && visibleSections.length > 0) {
        return visibleSections.includes(sectionKey);
      }

      // Fallback defaults if visibleSections not yet set
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

import { AppScreen } from '../domain/enums';
// Import new step
import { SectionSelectionStep } from './components/FormSteps';

const AppContent = () => {
  const { user, loading, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AppScreen | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showSourceDialog, setShowSourceDialog] = useState(false);

  // Builder State
  const [step, setStep] = useState<AppStep>(AppStep.USER_TYPE);
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [resumeService, setResumeService] = useState<ResumeService | null>(null);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);

  // Initialize service and load draft
  useEffect(() => {
    try {
      const service = createResumeService();
      setResumeService(service);

      const savedDraft = service.loadDraft();
      if (savedDraft) {
        // Ensure visibleSections has defaults if missing but userType exists (migration)
        let dataToSet = { ...savedDraft };
        if (savedDraft.userType && (!savedDraft.visibleSections || savedDraft.visibleSections.length === 0)) {
          const defaults = ['skills', 'education', 'projects'];
          if (savedDraft.userType === 'experienced') defaults.push('experience');
          if (savedDraft.userType === 'student') defaults.push('extracurriculars');

          // Check for data presence
          if (savedDraft.extracurriculars?.length) defaults.push('extracurriculars');
          if (savedDraft.awards?.length) defaults.push('awards');
          if (savedDraft.certifications?.length) defaults.push('certifications');
          if (savedDraft.affiliations?.length) defaults.push('affiliations');
          if (savedDraft.publications?.length) defaults.push('publications');

          dataToSet.visibleSections = Array.from(new Set(defaults));
        }

        setResumeData(dataToSet);

        // If user type is set, start at Sections instead of User Type
        if (savedDraft.userType) {
          setStep(AppStep.SECTIONS);
        }
      }
    } catch (error) {
      console.error('Failed to initialize resume service:', error);
      toast.error('Failed to initialize application. Please check your configuration.');
    }
  }, []);

  // Check profile completeness on login
  useEffect(() => {
    const checkProfileCompleteness = async () => {
      if (!user) {
        setCheckingProfile(false);
        setCurrentScreen(null);
        return;
      }

      setCheckingProfile(true);
      try {
        const isComplete = await profileRepository.isProfileComplete(user.id);
        if (isComplete) {
          setCurrentScreen(AppScreen.DASHBOARD);
        } else {
          setCurrentScreen(AppScreen.PROFILE_SETUP);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // Default to profile setup if check fails
        setCurrentScreen(AppScreen.PROFILE_SETUP);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfileCompleteness();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If not loading and no user -> Landing
  if (!user) {
    if (showLogin) {
      return <LoginScreen />;
    }
    return <LandingScreen onGetStarted={() => setShowLogin(true)} />;
  }

  // If user exists but still checking profile -> Loading
  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-gray-500">Loading Profile...</p>
        </div>
      </div>
    );
  }

  // Helper to pre-fill resume from profile
  const prefillFromProfile = async () => {
    if (!user) return;
    try {
      const [profile, exps, projs, skls, uType, edus, extras, awds, certs, affils, pubs] = await Promise.all([
        profileRepository.getProfile(user.id),
        profileRepository.getExperiences(user.id),
        profileRepository.getProjects(user.id),
        profileRepository.getSkills(user.id),
        profileRepository.getUserType(user.id),
        profileRepository.getEducations(user.id),
        profileRepository.getExtracurriculars(user.id),
        profileRepository.getAwards(user.id),
        profileRepository.getCertifications(user.id),
        profileRepository.getAffiliations(user.id),
        profileRepository.getPublications(user.id),
      ]);

      // Determine default visible sections based on populated data + user type defaults
      const initialVisible: string[] = ['skills', 'education', 'projects']; // Always nice to have
      if (uType === 'experienced') initialVisible.push('experience');
      if (uType === 'student') initialVisible.push('extracurriculars');
      // Add if data exists
      if (extras.length > 0) initialVisible.push('extracurriculars');
      if (awds.length > 0) initialVisible.push('awards');
      if (certs.length > 0) initialVisible.push('certifications');
      if (affils.length > 0) initialVisible.push('affiliations');
      if (pubs.length > 0) initialVisible.push('publications');

      // Dedupe
      const uniqueVisible = Array.from(new Set(initialVisible));

      setResumeData({
        ...INITIAL_DATA,
        userType: uType || undefined,
        personalInfo: profile || INITIAL_DATA.personalInfo,
        experience: exps,
        projects: projs,
        skills: skls,
        education: edus,
        extracurriculars: extras,
        awards: awds,
        certifications: certs,
        affiliations: affils,
        publications: pubs,
        visibleSections: uniqueVisible
      });
      // Skip user type step if already known
      if (uType) {
        setStep(AppStep.SECTIONS); // Go to sections selection to confirm
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load profile data');
    }
  };

  // Handle source choice
  const handleChooseProfile = async () => {
    setShowSourceDialog(false);
    await prefillFromProfile();
    setCurrentScreen(AppScreen.BUILDER);
  };

  const handleChooseFresh = () => {
    setShowSourceDialog(false);
    setResumeData({
      ...INITIAL_DATA,
      visibleSections: DEFAULT_SECTIONS // Default to all or allow user to pick later?
      // Actually, let's keep it undefined initially so defaults logic in getVisibleSteps works, 
      // OR better: Initialize with defaults based on nothing, and let user pick.
    });
    setStep(AppStep.USER_TYPE);
    setCurrentScreen(AppScreen.BUILDER);
  };

  // Authenticated Routing
  const handleOpenResume = async (id: string) => {
    if (!user || !resumeService) return;
    try {
      const data = await resumeService.getGeneratedResume(id);
      if (data) {
        setResumeData(data);
        setCurrentResumeId(id);
        setStep(AppStep.PREVIEW); // Or AppStep.SECTIONS if editing? Usually Preview to check first.
        setCurrentScreen(AppScreen.BUILDER);
      }
    } catch (error) {
      console.error('Failed to load resume', error);
      toast.error('Failed to load resume');
    }
  };

  if (currentScreen === AppScreen.PROFILE_SETUP) {
    return (
      <ProfileSetupScreen
        onComplete={() => setCurrentScreen(AppScreen.DASHBOARD)}
      />
    );
  }

  if (currentScreen === AppScreen.DASHBOARD) {
    return (
      <>
        <DashboardScreen
          onCreateNew={() => setShowSourceDialog(true)}
          onEditProfile={() => setCurrentScreen(AppScreen.PROFILE)}
          onOpenApplication={(id) => {
            console.log("Open App", id);
            // TODO: Load application data then switch to builder
            setCurrentScreen(AppScreen.BUILDER);
          }}
          onOpenResume={handleOpenResume}
        />
        <ResumeSourceDialog
          isOpen={showSourceDialog}
          onClose={() => setShowSourceDialog(false)}
          onChooseProfile={handleChooseProfile}
          onChooseFresh={handleChooseFresh}
        />
      </>
    );
  }

  if (currentScreen === AppScreen.PROFILE) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          onDashboardClick={() => setCurrentScreen(AppScreen.DASHBOARD)}
          showExitBuilder={false}
        />
        <ProfileScreen />
      </div>
    );
  }

  // ... Builder Logic (Render the existing wizard if screen is BUILDER) ...
  const visibleSteps = getVisibleSteps(resumeData.userType, resumeData.visibleSections);
  const isLastStep = visibleSteps.length > 0 && visibleSteps[visibleSteps.length - 1].id === step;

  const handleNext = () => {
    // Validate Experience Description
    if (step === AppStep.EXPERIENCE && resumeData.userType === 'experienced') {
      const hasEmptyDescription = resumeData.experience.some(exp => !exp.rawDescription?.trim());
      if (hasEmptyDescription) {
        toast.error('Please describe your experience for all positions before proceeding.');
        return;
      }
    }

    // Validate Projects Description
    if (step === AppStep.PROJECTS) {
      const hasEmptyDescription = resumeData.projects.some(p => !p.rawDescription?.trim());
      if (hasEmptyDescription) {
        toast.error('Please add a description for all your projects so the AI can optimize them.');
        return;
      }
    }

    // Validate Extracurriculars Description
    if (step === AppStep.EXTRACURRICULARS) {
      if (resumeData.extracurriculars) {
        const hasEmptyDescription = resumeData.extracurriculars.some(e => !e.description?.trim());
        if (hasEmptyDescription) {
          toast.error('Please add a description for all extracurricular activities.');
          return;
        }
      }
    }

    // Auto-populate visible sections if passing user type for the first time without sections set
    if (step === AppStep.USER_TYPE && (!resumeData.visibleSections || resumeData.visibleSections.length === 0)) {
      const defaults = ['education', 'skills', 'projects'];
      if (resumeData.userType === 'experienced') defaults.push('experience');
      // Add others as needed
      setResumeData(prev => ({ ...prev, visibleSections: defaults }));
    }

    const visibleSteps = getVisibleSteps(resumeData.userType, resumeData.visibleSections);
    const currentIndex = visibleSteps.findIndex(s => s.id === step);

    if (currentIndex < visibleSteps.length - 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep(visibleSteps[currentIndex + 1].id);
    } else {
      // Proceed to Preview if we are at the last step
      handleGenerate();
    }
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const visibleSteps = getVisibleSteps(resumeData.userType, resumeData.visibleSections);
    const currentIndex = visibleSteps.findIndex(s => s.id === step);

    if (currentIndex > 0) {
      setStep(visibleSteps[currentIndex - 1].id);
    } else if (step === AppStep.PREVIEW) {
      // From Preview go back to last visible step
      setStep(visibleSteps[visibleSteps.length - 1].id);
    } else {
      // Can't go back further than first step
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

      // Auto-save to Dashboard
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
    if (!resumeService) {
      throw new Error('Service not initialized');
    }
    await resumeService.exportToWord(data);
  };

  const handleExportCoverLetter = async (data: ResumeData) => {
    if (!resumeService) {
      throw new Error('Service not initialized');
    }
    await resumeService.exportCoverLetterToWord(data);
  };

  // --- Landing Page ---
  if (step === AppStep.LANDING) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col justify-center items-center p-6 text-center">
        <div className="bg-white p-4 rounded-full shadow-md mb-6 animate-bounce">
          <FileText size={48} className="text-indigo-600" />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Roh ATS Resume <span className="text-indigo-600">Builder</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          Don't just write a resume. Tailor it using AI. <br />
          Paste the job description, input your details, and get a perfectly
          optimized PDF in seconds.
        </p>
        <button
          onClick={() => setStep(AppStep.USER_TYPE)}
          className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          Start Building
          <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="mt-8 text-sm text-gray-400">
          Powered by Google Gemini 2.5 Flash
        </p>
      </div>
    );
  }

  // --- Preview Page ---
  if (step === AppStep.PREVIEW) {
    return (
      <Preview
        data={resumeData}
        onUpdate={setResumeData}
        onGoHome={() => {
          setCurrentScreen(AppScreen.DASHBOARD);
          // Optional: clear current resume ID if you want to ensuring fresh state next time
          // but keeping it might be fine. Let's just switch screen.
        }}
        onExportWord={handleExportWord}
        onExportCoverLetter={handleExportCoverLetter}
        readOnly={!!currentResumeId && step === AppStep.PREVIEW}
      />
    );
  }

  // --- Wizard Layout ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 1. Global Navbar */}
      <Navbar
        onDashboardClick={() => setCurrentScreen(AppScreen.DASHBOARD)}
        showExitBuilder={true}
      />

      {/* 2. Builder Progress Stepper */}
      <BuilderStepper
        steps={getVisibleSteps(resumeData.userType, resumeData.visibleSections)}
        currentStep={step}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[500px] relative">
          {step === AppStep.USER_TYPE && (
            <UserTypeStep
              userType={resumeData.userType}
              update={userType => setResumeData({ ...resumeData, userType })}
            />
          )}
          {step === AppStep.SECTIONS && (
            <SectionSelectionStep
              selected={resumeData.visibleSections || []}
              update={sections => setResumeData({ ...resumeData, visibleSections: sections })}
              userType={resumeData.userType}
            />
          )}
          {step === AppStep.TARGET_JOB && (
            <TargetJobStep
              data={resumeData.targetJob}
              update={d =>
                setResumeData({ ...resumeData, targetJob: d })
              }
            />
          )}
          {step === AppStep.PERSONAL_INFO && (
            <PersonalInfoStep
              data={resumeData.personalInfo}
              update={d =>
                setResumeData({ ...resumeData, personalInfo: d })
              }
            />
          )}
          {step === AppStep.EXPERIENCE && resumeData.userType === 'experienced' && (
            <ExperienceStep
              data={resumeData.experience}
              update={d => setResumeData({ ...resumeData, experience: d })}
            />
          )}
          {step === AppStep.PROJECTS && (
            <ProjectsStep
              data={resumeData.projects}
              update={d => setResumeData({ ...resumeData, projects: d })}
            />
          )}
          {step === AppStep.EDUCATION && (
            <EducationStep
              data={resumeData.education}
              update={d => setResumeData({ ...resumeData, education: d })}
            />
          )}
          {step === AppStep.SKILLS && (
            <SkillsStep
              data={resumeData.skills}
              update={d => setResumeData({ ...resumeData, skills: d })}
            />
          )}
          {step === AppStep.EXTRACURRICULARS && (
            <ExtracurricularStep
              data={resumeData.extracurriculars || []}
              update={d => setResumeData({ ...resumeData, extracurriculars: d })}
            />
          )}
          {step === AppStep.AWARDS && (
            <AwardsStep
              data={resumeData.awards || []}
              update={d => setResumeData({ ...resumeData, awards: d })}
            />
          )}
          {step === AppStep.CERTIFICATIONS && (
            <CertificationsStep
              data={resumeData.certifications || []}
              update={d => setResumeData({ ...resumeData, certifications: d })}
            />
          )}
          {step === AppStep.AFFILIATIONS && (
            <AffiliationsStep
              data={resumeData.affiliations || []}
              update={d => setResumeData({ ...resumeData, affiliations: d })}
            />
          )}
          {step === AppStep.PUBLICATIONS && (
            <PublicationsStep
              data={resumeData.publications || []}
              update={d => setResumeData({ ...resumeData, publications: d })}
            />
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={24} className="text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h3 className="mt-6 text-xl font-bold text-gray-800">
                Optimizing Resume...
              </h3>
              <p className="text-gray-500 mt-2 text-center max-w-md px-4">
                Our AI is rewriting your bullets to match the job description
                and formatting your document. This takes about 10-15 seconds.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={step === AppStep.USER_TYPE || isGenerating}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${step === AppStep.USER_TYPE
              ? 'opacity-0 cursor-default'
              : 'text-gray-600 hover:bg-gray-100'
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
                onClick={handleNext}
                disabled={!resumeData.userType}
                className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : isLastStep ? (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:to-indigo-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
              >
                {isGenerating ? 'Generating...' : 'Generate Resume'}{' '}
                <Sparkles size={18} />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all transform active:scale-95"
              >
                Next <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </footer>
      <Toaster richColors position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
