// Presentation Layer - Main App Component

import React, { useState, useEffect } from 'react';
import { ResumeData, AppStep } from '../domain/entities';
import {
  UserTypeStep,
  TargetJobStep,
  PersonalInfoStep,
  ExperienceStep,
  ProjectsStep,
  EducationStep,
  SkillsStep,
} from './components/FormSteps';
import { Preview } from './components/Preview';
import { ResumeService } from '../application/services/ResumeService';
import { createResumeService } from '../infrastructure/config/dependencies';
import { ChevronRight, ChevronLeft, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

const INITIAL_DATA: ResumeData = {
  userType: undefined,
  targetJob: { title: '', company: '', description: '' },
  personalInfo: { fullName: '', email: '', phone: '', location: '' },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: [],
};

const STEPS_INFO = [
  { id: AppStep.USER_TYPE, title: 'User Type' },
  { id: AppStep.TARGET_JOB, title: 'Target Job' },
  { id: AppStep.PERSONAL_INFO, title: 'Personal Info' },
  { id: AppStep.EXPERIENCE, title: 'Experience' },
  { id: AppStep.PROJECTS, title: 'Projects' },
  { id: AppStep.EDUCATION, title: 'Education' },
  { id: AppStep.SKILLS, title: 'Skills' },
];

// Get visible steps based on user type
const getVisibleSteps = (userType?: 'experienced' | 'student') => {
  if (!userType) {
    // Before user type is selected, show all steps
    return STEPS_INFO;
  }

  if (userType === 'student') {
    // Skip Experience step for students
    return STEPS_INFO.filter(s => s.id !== AppStep.EXPERIENCE);
  }

  // Show all steps for experienced users
  return STEPS_INFO;
};

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [resumeService, setResumeService] = useState<ResumeService | null>(null);

  // Initialize service
  useEffect(() => {
    try {
      const service = createResumeService();
      setResumeService(service);
    } catch (error) {
      console.error('Failed to initialize resume service:', error);
      setGenerationError('Failed to initialize application. Please check your configuration.');
    }
  }, []);

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Skip Experience step for students
    if (resumeData.userType === 'student' && step === AppStep.PERSONAL_INFO) {
      setStep(AppStep.PROJECTS);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Skip Experience step for students when going back
    if (resumeData.userType === 'student' && step === AppStep.PROJECTS) {
      setStep(AppStep.PERSONAL_INFO);
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleGenerate = async () => {
    if (!resumeService) {
      setGenerationError('Service not initialized. Please refresh the page.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    try {
      const optimizedData = await resumeService.optimizeResume(resumeData);
      const mergedData = resumeService.mergeOptimizedData(resumeData, optimizedData);
      setResumeData(mergedData);
      setStep(AppStep.PREVIEW);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to generate resume. Please check your internet connection or API key and try again.';
      setGenerationError(errorMessage);
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
        onEdit={() => setStep(AppStep.SKILLS)}
        onExportWord={handleExportWord}
        onExportCoverLetter={handleExportCoverLetter}
      />
    );
  }

  // --- Wizard Layout ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar / Stepper */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-4">
            <div className="w-auto px-2 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm">
              Roh ATS
            </div>
            Resume Builder
          </div>

          {/* Desktop Stepper */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              {(() => {
                const visibleSteps = getVisibleSteps(resumeData.userType);
                return visibleSteps.map((s, idx) => {
                  const isActive = s.id === step;
                  const isCompleted = s.id < step;
                  const isUpcoming = s.id > step;

                  return (
                    <React.Fragment key={s.id}>
                      {/* Step Circle and Label */}
                      <div className="flex flex-col items-center flex-1 relative">
                        <div className="flex flex-col items-center">
                          {/* Step Circle */}
                          <div
                            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${isActive
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110'
                              : isCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-500 border-2 border-gray-300'
                              }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={18} className="text-white" />
                            ) : (
                              <span className="text-sm font-bold">{idx + 1}</span>
                            )}
                          </div>

                          {/* Step Label */}
                          <div className="mt-2 text-center">
                            <div
                              className={`text-xs font-medium transition-colors ${isActive
                                ? 'text-indigo-600 font-semibold'
                                : isCompleted
                                  ? 'text-green-600'
                                  : 'text-gray-400'
                                }`}
                            >
                              {s.title}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Connector Line */}
                      {idx < visibleSteps.length - 1 && (
                        <div className="flex-1 mx-2 h-0.5 relative -top-5">
                          <div
                            className={`h-full transition-all duration-300 ${isCompleted
                              ? 'bg-green-500'
                              : 'bg-gray-200'
                              }`}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                });
              })()}
            </div>
          </div>

          {/* Mobile Stepper */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-2">
              {(() => {
                const visibleSteps = getVisibleSteps(resumeData.userType);
                const currentStepIndex = visibleSteps.findIndex(s => s.id === step);
                return (
                  <>
                    <div className="text-xs font-medium text-gray-600">
                      Step {currentStepIndex + 1} of {visibleSteps.length}
                    </div>
                    <div className="text-xs font-semibold text-indigo-600">
                      {visibleSteps[currentStepIndex]?.title}
                    </div>
                  </>
                );
              })()}
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              {(() => {
                const visibleSteps = getVisibleSteps(resumeData.userType);
                const currentStepIndex = visibleSteps.findIndex(s => s.id === step);
                const progress = ((currentStepIndex + 1) / visibleSteps.length) * 100;
                return (
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[500px] relative">
          {step === AppStep.USER_TYPE && (
            <UserTypeStep
              userType={resumeData.userType}
              update={userType => setResumeData({ ...resumeData, userType })}
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
            ) : step === AppStep.SKILLS ? (
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
    </div>
  );
}

