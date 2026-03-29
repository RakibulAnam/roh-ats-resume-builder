import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { ResumeData, AppStep } from '../domain/entities';
import { BuilderScreen } from './BuilderScreen';
import { ResumeService } from '../application/services/ResumeService';
import { createResumeService, profileRepository } from '../infrastructure/config/dependencies';
import { AuthProvider, useAuth } from '../infrastructure/auth/AuthContext';
import { LoginScreen } from './LoginScreen';
import { LandingScreen } from './LandingScreen';
import { FileText, Loader2, ChevronRight } from 'lucide-react';

import { Navbar } from './components/Layout/Navbar';
import { DashboardScreen } from './DashboardScreen';
import { ProfileScreen } from './ProfileScreen';
import { ProfileSetupScreen } from './ProfileSetupScreen';
import { ResumeSourceDialog } from './components/ResumeSourceDialog';
import { AppScreen } from '../domain/enums';

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

const DEFAULT_SECTIONS = [
  'experience', 'education', 'projects', 'skills',
  'extracurriculars', 'awards', 'certifications', 'affiliations', 'publications'
];

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AppScreen | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showSourceDialog, setShowSourceDialog] = useState(false);

  const [resumeService, setResumeService] = useState<ResumeService | null>(null);
  
  // Builder Hand-off State
  const [builderData, setBuilderData] = useState<ResumeData>(INITIAL_DATA);
  const [builderStep, setBuilderStep] = useState<AppStep>(AppStep.USER_TYPE);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const service = createResumeService();
      setResumeService(service);

      const savedDraft = service.loadDraft();
      if (savedDraft) {
        let dataToSet = { ...savedDraft };
        if (savedDraft.userType && (!savedDraft.visibleSections || savedDraft.visibleSections.length === 0)) {
          const defaults = ['skills', 'education', 'projects'];
          if (savedDraft.userType === 'experienced') defaults.push('experience');
          if (savedDraft.userType === 'student') defaults.push('extracurriculars');

          if (savedDraft.extracurriculars?.length) defaults.push('extracurriculars');
          if (savedDraft.awards?.length) defaults.push('awards');
          if (savedDraft.certifications?.length) defaults.push('certifications');
          if (savedDraft.affiliations?.length) defaults.push('affiliations');
          if (savedDraft.publications?.length) defaults.push('publications');

          dataToSet.visibleSections = Array.from(new Set(defaults));
        }

        setBuilderData(dataToSet);

        if (savedDraft.userType) {
          setBuilderStep(AppStep.SECTIONS);
        }
      }
    } catch (error) {
      console.error('Failed to initialize resume service:', error);
      toast.error('Failed to initialize application. Please check your configuration.');
    }
  }, []);

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
        setCurrentScreen(AppScreen.PROFILE_SETUP);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfileCompleteness();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-600" size={40} />
          <p className="text-charcoal-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showLogin) {
      return <LoginScreen />;
    }
    return <LandingScreen onGetStarted={() => setShowLogin(true)} />;
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-600" size={40} />
          <p className="text-charcoal-500">Loading Profile…</p>
        </div>
      </div>
    );
  }

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

      const initialVisible: string[] = ['skills', 'education', 'projects'];
      if (uType === 'experienced') initialVisible.push('experience');
      if (uType === 'student') initialVisible.push('extracurriculars');
      
      if (extras.length > 0) initialVisible.push('extracurriculars');
      if (awds.length > 0) initialVisible.push('awards');
      if (certs.length > 0) initialVisible.push('certifications');
      if (affils.length > 0) initialVisible.push('affiliations');
      if (pubs.length > 0) initialVisible.push('publications');

      const uniqueVisible = Array.from(new Set(initialVisible));

      setBuilderData({
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
      
      if (uType) {
        setBuilderStep(AppStep.SECTIONS);
      } else {
        setBuilderStep(AppStep.USER_TYPE);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load profile data');
    }
  };

  const handleChooseProfile = async () => {
    setShowSourceDialog(false);
    await prefillFromProfile();
    setCurrentScreen(AppScreen.BUILDER);
  };

  const handleChooseFresh = () => {
    setShowSourceDialog(false);
    setBuilderData({
      ...INITIAL_DATA,
      visibleSections: DEFAULT_SECTIONS
    });
    setBuilderStep(AppStep.USER_TYPE);
    setCurrentScreen(AppScreen.BUILDER);
  };

  const handleOpenResume = async (id: string) => {
    if (!user || !resumeService) return;
    try {
      const data = await resumeService.getGeneratedResume(id);
      if (data) {
        setBuilderData(data);
        setCurrentResumeId(id);
        setBuilderStep(AppStep.PREVIEW);
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
            // Implementation pending per existing codebase
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
      <div className="min-h-screen bg-charcoal-50">
        <Navbar
          onDashboardClick={() => setCurrentScreen(AppScreen.DASHBOARD)}
          showExitBuilder={false}
        />
        <ProfileScreen />
      </div>
    );
  }

  if (currentScreen === AppScreen.BUILDER) {
    return (
      <BuilderScreen 
        initialData={builderData}
        initialStep={builderStep}
        currentResumeId={currentResumeId}
        resumeService={resumeService}
        onExit={() => setCurrentScreen(AppScreen.DASHBOARD)}
      />
    );
  }

  // Fallback / Landing (Only reachable if screen is somehow forced null after login)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-brand-600" size={40} />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}

