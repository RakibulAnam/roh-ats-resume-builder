// Complete-your-profile wizard. One-time capture of the master profile that
// seeds every future tailored resume.
//
// Layout: sticky left rail (phase groups) + right content card. Rail collapses
// to a slim progress bar on mobile. Palette follows AGENTS.md §10 — Editorial
// Ink + Saffron, no gradients.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../infrastructure/auth/AuthContext';
import { profileRepository } from '../infrastructure/config/dependencies';
import { ResumeService } from '../application/services/ResumeService';
import { toast } from 'sonner';
import {
    UserTypeStep,
    PersonalInfoStep,
    ExperienceStep,
    ProjectsStep,
    SkillsStep,
    EducationStep,
    ExtracurricularStep,
    AwardsStep,
    CertificationsStep,
    AffiliationsStep,
    PublicationsStep,
} from './components/FormSteps';
import {
    PersonalInfo,
    WorkExperience,
    Project,
    UserType,
    Extracurricular,
    Award,
    Certification,
    Affiliation,
    Publication,
    Education,
} from '../domain/entities/Resume';
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Loader2,
    LogOut,
    Sparkles,
    AlertCircle,
    FileText,
} from 'lucide-react';
import { ResumeUploadStep } from './components/profile/ResumeUploadStep';
import { ExtractedProfileData } from '../domain/usecases/ExtractResumeUseCase';

interface Props {
    onComplete: () => void;
    resumeService: ResumeService | null;
}

enum SetupStep {
    IMPORT_RESUME = -1,
    USER_TYPE = 0,
    PERSONAL_INFO = 1,
    EDUCATION = 2,
    EXPERIENCE_OR_PROJECTS = 3,
    SKILLS = 4,
    EXTRACURRICULARS = 5,
    AWARDS = 6,
    CERTIFICATIONS = 7,
    AFFILIATIONS = 8,
    PUBLICATIONS = 9,
}

const STEP_COPY: Record<SetupStep, { label: string; phase: string }> = {
    [SetupStep.IMPORT_RESUME]: { label: 'Import', phase: 'Quick start' },
    [SetupStep.USER_TYPE]: { label: 'Your path', phase: 'About you' },
    [SetupStep.PERSONAL_INFO]: { label: 'Contact details', phase: 'About you' },
    [SetupStep.EDUCATION]: { label: 'Education', phase: 'About you' },
    [SetupStep.EXPERIENCE_OR_PROJECTS]: { label: 'Experience', phase: 'Your work' },
    [SetupStep.SKILLS]: { label: 'Skills', phase: 'Your work' },
    [SetupStep.EXTRACURRICULARS]: { label: 'Activities', phase: 'Your credentials' },
    [SetupStep.AWARDS]: { label: 'Awards', phase: 'Your credentials' },
    [SetupStep.CERTIFICATIONS]: { label: 'Certifications', phase: 'Your credentials' },
    [SetupStep.AFFILIATIONS]: { label: 'Affiliations', phase: 'Your credentials' },
    [SetupStep.PUBLICATIONS]: { label: 'Publications', phase: 'Your credentials' },
};

const Wordmark = () => (
    <div className="flex items-baseline gap-1.5 select-none">
        <span className="font-display text-lg font-semibold tracking-tight text-brand-700">TOP</span>
        <span className="font-display text-lg font-semibold tracking-tight text-accent-500">CANDIDATE</span>
    </div>
);

export const ProfileSetupScreen: React.FC<Props> = ({ onComplete, resumeService }) => {
    const { user, signOut } = useAuth();
    const [currentStep, setCurrentStep] = useState(SetupStep.IMPORT_RESUME);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isGeneratingResume, setIsGeneratingResume] = useState(false);
    const [generationFailed, setGenerationFailed] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const [userType, setUserType] = useState<UserType | undefined>(undefined);
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
        fullName: '',
        email: '',
        phone: '',
        location: '',
    });
    const [experiences, setExperiences] = useState<WorkExperience[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [education, setEducation] = useState<Education[]>([]);
    const [skills, setSkills] = useState<string[]>([]);
    const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
    const [awards, setAwards] = useState<Award[]>([]);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
    const [publications, setPublications] = useState<Publication[]>([]);

    useEffect(() => {
        if (user?.id) {
            loadExistingData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const loadExistingData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [profile, exps, projs, edus, skls, uType, extras, awds, certs, affs, pubs] =
                await Promise.all([
                    profileRepository.getProfile(user.id),
                    profileRepository.getExperiences(user.id),
                    profileRepository.getProjects(user.id),
                    profileRepository.getEducations(user.id),
                    profileRepository.getSkills(user.id),
                    profileRepository.getUserType(user.id),
                    profileRepository.getExtracurriculars(user.id),
                    profileRepository.getAwards(user.id),
                    profileRepository.getCertifications(user.id),
                    profileRepository.getAffiliations(user.id),
                    profileRepository.getPublications(user.id),
                ]);

            if (profile) setPersonalInfo(profile);
            if (exps.length > 0) setExperiences(exps);
            if (projs.length > 0) setProjects(projs);
            if (edus.length > 0) setEducation(edus);
            if (skls.length > 0) setSkills(skls);
            if (uType) setUserType(uType);
            if (extras.length > 0) setExtracurriculars(extras);
            if (awds.length > 0) setAwards(awds);
            if (certs.length > 0) setCertifications(certs);
            if (affs.length > 0) setAffiliations(affs);
            if (pubs.length > 0) setPublications(pubs);

            // Resume at the first step that still lacks data.
            let nextStep = SetupStep.IMPORT_RESUME;
            if (uType) {
                if (!(profile?.fullName && profile?.email)) {
                    nextStep = SetupStep.PERSONAL_INFO;
                } else if (edus.length === 0) {
                    nextStep = SetupStep.EDUCATION;
                } else if (
                    (uType === 'experienced' && exps.length === 0) ||
                    (uType === 'student' && projs.length === 0)
                ) {
                    nextStep = SetupStep.EXPERIENCE_OR_PROJECTS;
                } else if (skls.length === 0) {
                    nextStep = SetupStep.SKILLS;
                } else {
                    // Resume at the first credentials step for their path.
                    nextStep = uType === 'student'
                        ? SetupStep.EXTRACURRICULARS
                        : SetupStep.CERTIFICATIONS;
                }
            }
            setCurrentStep(nextStep);
        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getVisibleSteps = (): SetupStep[] => {
        const base = [
            SetupStep.IMPORT_RESUME,
            SetupStep.USER_TYPE,
            SetupStep.PERSONAL_INFO,
            SetupStep.EDUCATION,
            SetupStep.EXPERIENCE_OR_PROJECTS,
            SetupStep.SKILLS,
        ];
        if (userType === 'student') {
            return [...base, SetupStep.EXTRACURRICULARS, SetupStep.AWARDS];
        }
        if (userType === 'experienced') {
            return [
                ...base,
                SetupStep.CERTIFICATIONS,
                SetupStep.AFFILIATIONS,
                SetupStep.PUBLICATIONS,
            ];
        }
        return base;
    };

    const stepHasContent = (step: SetupStep): boolean => {
        switch (step) {
            case SetupStep.IMPORT_RESUME: return true; // never blocks
            case SetupStep.USER_TYPE: return !!userType;
            case SetupStep.PERSONAL_INFO:
                return !!(personalInfo.fullName || '').trim() && !!(personalInfo.email || '').trim();
            case SetupStep.EDUCATION: return education.length > 0;
            case SetupStep.EXPERIENCE_OR_PROJECTS:
                return userType === 'student' ? projects.length > 0 : experiences.length > 0;
            case SetupStep.SKILLS: return skills.length > 0;
            case SetupStep.EXTRACURRICULARS: return extracurriculars.length > 0;
            case SetupStep.AWARDS: return awards.length > 0;
            case SetupStep.CERTIFICATIONS: return certifications.length > 0;
            case SetupStep.AFFILIATIONS: return affiliations.length > 0;
            case SetupStep.PUBLICATIONS: return publications.length > 0;
            default: return false;
        }
    };

    const validateCurrentStep = (showToast = true): boolean => {
        const showError = (msg: string) => {
            if (showToast) toast.error(msg);
        };

        switch (currentStep) {
            case SetupStep.IMPORT_RESUME:
                return true;
            case SetupStep.USER_TYPE:
                if (!userType) { showError('Pick the path that fits you best to continue.'); return false; }
                return true;
            case SetupStep.PERSONAL_INFO:
                if (!(personalInfo.fullName || '').trim()) { showError('We need your full name.'); return false; }
                if (!(personalInfo.email || '').trim()) { showError('We need an email recruiters can reach you at.'); return false; }
                return true;
            case SetupStep.EDUCATION:
                if (education.length === 0) { showError('Add at least one school.'); return false; }
                for (const edu of education) {
                    if (!(edu.school || '').trim() || !(edu.degree || '').trim() || !(edu.field || '').trim()) {
                        showError('Fill in school, degree, and field for every entry.'); return false;
                    }
                    if (!(edu.startDate || '').trim() || !(edu.endDate || '').trim()) {
                        showError('Add start and end years for every school.'); return false;
                    }
                }
                return true;
            case SetupStep.EXPERIENCE_OR_PROJECTS:
                if (userType === 'experienced' && experiences.length === 0) {
                    showError('Add at least one position — even an internship counts.'); return false;
                }
                if (userType === 'student' && projects.length === 0) {
                    showError('Add at least one project — capstones, coursework, and clubs all count.'); return false;
                }
                if (userType === 'experienced') {
                    for (const exp of experiences) {
                        if (!(exp.company || '').trim() || !(exp.role || '').trim()) {
                            showError('Each position needs a role and a company.'); return false;
                        }
                        if (!(exp.startDate || '').trim() || (!exp.isCurrent && !(exp.endDate || '').trim())) {
                            showError('Each position needs start and end dates (or "I currently work here").'); return false;
                        }
                        if (!(exp.rawDescription || '').trim()) {
                            showError('Each position needs a brain-dump of what you did.'); return false;
                        }
                    }
                } else {
                    for (const proj of projects) {
                        if (!(proj.name || '').trim()) { showError('Every project needs a name.'); return false; }
                        if (!(proj.rawDescription || '').trim()) {
                            showError('Every project needs a description — one short paragraph is plenty.'); return false;
                        }
                    }
                }
                return true;
            case SetupStep.SKILLS:
                if (skills.length === 0) { showError('Add at least one skill — they drive ATS keyword matches.'); return false; }
                return true;
            case SetupStep.EXTRACURRICULARS:
                for (const item of extracurriculars) {
                    if (!(item.title || '').trim() || !(item.organization || '').trim()) {
                        showError('Each activity needs a role and an organization.'); return false;
                    }
                    if (!(item.startDate || '').trim() || !(item.endDate || '').trim()) {
                        showError('Each activity needs start and end dates.'); return false;
                    }
                }
                return true;
            case SetupStep.AWARDS:
                for (const item of awards) {
                    if (!(item.title || '').trim() || !(item.issuer || '').trim()) {
                        showError('Each award needs a title and issuer.'); return false;
                    }
                    if (!(item.date || '').trim()) { showError('Each award needs a date.'); return false; }
                }
                return true;
            case SetupStep.CERTIFICATIONS:
                for (const item of certifications) {
                    if (!(item.name || '').trim() || !(item.issuer || '').trim()) {
                        showError('Each certification needs a name and issuer.'); return false;
                    }
                    if (!(item.date || '').trim()) { showError('Each certification needs a date.'); return false; }
                }
                return true;
            case SetupStep.AFFILIATIONS:
                for (const item of affiliations) {
                    if (!(item.organization || '').trim() || !(item.role || '').trim()) {
                        showError('Each affiliation needs a role and organization.'); return false;
                    }
                    if (!(item.startDate || '').trim() || !(item.endDate || '').trim()) {
                        showError('Each affiliation needs start and end dates.'); return false;
                    }
                }
                return true;
            case SetupStep.PUBLICATIONS:
                for (const item of publications) {
                    if (!(item.title || '').trim() || !(item.publisher || '').trim()) {
                        showError('Each publication needs a title and publisher.'); return false;
                    }
                    if (!(item.date || '').trim()) { showError('Each publication needs a date.'); return false; }
                }
                return true;
            default:
                return true;
        }
    };

    const saveCurrentStep = async (): Promise<boolean> => {
        if (!user) return false;
        setSaving(true);
        try {
            switch (currentStep) {
                case SetupStep.USER_TYPE:
                    if (userType) await profileRepository.saveUserType(user.id, userType);
                    break;
                case SetupStep.PERSONAL_INFO:
                    await profileRepository.saveProfile(user.id, personalInfo);
                    break;
                case SetupStep.EDUCATION:
                    for (const edu of education) await profileRepository.saveEducation(user.id, edu);
                    break;
                case SetupStep.EXPERIENCE_OR_PROJECTS:
                    if (userType === 'experienced') {
                        for (const exp of experiences) await profileRepository.saveExperience(user.id, exp);
                    } else {
                        for (const proj of projects) await profileRepository.saveProject(user.id, proj);
                    }
                    break;
                case SetupStep.SKILLS:
                    await profileRepository.saveSkills(user.id, skills);
                    break;
                case SetupStep.EXTRACURRICULARS:
                    for (const item of extracurriculars) await profileRepository.saveExtracurricular(user.id, item);
                    break;
                case SetupStep.AWARDS:
                    for (const item of awards) await profileRepository.saveAward(user.id, item);
                    break;
                case SetupStep.CERTIFICATIONS:
                    for (const item of certifications) await profileRepository.saveCertification(user.id, item);
                    break;
                case SetupStep.AFFILIATIONS:
                    for (const item of affiliations) await profileRepository.saveAffiliation(user.id, item);
                    break;
                case SetupStep.PUBLICATIONS:
                    for (const item of publications) await profileRepository.savePublication(user.id, item);
                    break;
            }
            return true;
        } catch (error) {
            console.error('Error saving step:', error);
            toast.error('We couldn\'t save that. Please try again.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleExtracted = (data: ExtractedProfileData) => {
        if (data.userType) setUserType(data.userType);
        if (data.personalInfo) {
            setPersonalInfo(prev => ({
                fullName: data.personalInfo?.fullName || prev.fullName,
                email: data.personalInfo?.email || prev.email,
                phone: data.personalInfo?.phone || prev.phone,
                location: data.personalInfo?.location || prev.location,
                linkedin: data.personalInfo?.linkedin || prev.linkedin,
                github: data.personalInfo?.github || prev.github,
                website: data.personalInfo?.website || prev.website,
            }));
        }
        if (data.experience?.length) setExperiences(data.experience);
        if (data.projects?.length) setProjects(data.projects);
        if (data.skills?.length) setSkills(data.skills);
        if (data.extracurriculars?.length) setExtracurriculars(data.extracurriculars);
        if (data.awards?.length) setAwards(data.awards);
        if (data.certifications?.length) setCertifications(data.certifications);
        if (data.affiliations?.length) setAffiliations(data.affiliations);
        if (data.publications?.length) setPublications(data.publications);

        setCurrentStep(SetupStep.USER_TYPE);
    };

    const handleSkipImport = () => setCurrentStep(SetupStep.USER_TYPE);

    const renderCurrentStep = () => {
        switch (currentStep) {
            case SetupStep.IMPORT_RESUME:
                return <ResumeUploadStep onExtracted={handleExtracted} onSkip={handleSkipImport} />;
            case SetupStep.USER_TYPE:
                return <UserTypeStep userType={userType} update={setUserType} />;
            case SetupStep.PERSONAL_INFO:
                return <PersonalInfoStep data={personalInfo} update={setPersonalInfo} />;
            case SetupStep.EDUCATION:
                return <EducationStep data={education} update={setEducation} />;
            case SetupStep.EXPERIENCE_OR_PROJECTS:
                if (userType === 'student') {
                    return <ProjectsStep data={projects} update={setProjects} userType={userType} />;
                }
                return <ExperienceStep data={experiences} update={setExperiences} />;
            case SetupStep.SKILLS:
                return <SkillsStep data={skills} update={setSkills} userType={userType} />;
            case SetupStep.EXTRACURRICULARS:
                return <ExtracurricularStep data={extracurriculars} update={setExtracurriculars} />;
            case SetupStep.AWARDS:
                return <AwardsStep data={awards} update={setAwards} />;
            case SetupStep.CERTIFICATIONS:
                return <CertificationsStep data={certifications} update={setCertifications} />;
            case SetupStep.AFFILIATIONS:
                return <AffiliationsStep data={affiliations} update={setAffiliations} />;
            case SetupStep.PUBLICATIONS:
                return <PublicationsStep data={publications} update={setPublications} />;
            default:
                return null;
        }
    };

    const visibleSteps = getVisibleSteps();
    const currentStepIndex = visibleSteps.indexOf(currentStep);
    const totalSteps = visibleSteps.length;
    // Progress excludes the optional IMPORT_RESUME phase-zero so users don't
    // feel stuck at 0% when they've just landed.
    const progressSteps = visibleSteps.filter(s => s !== SetupStep.IMPORT_RESUME);
    const progressIndex = currentStep === SetupStep.IMPORT_RESUME
        ? 0
        : progressSteps.indexOf(currentStep) + 1;
    const progressPercent = progressSteps.length > 0
        ? (progressIndex / progressSteps.length) * 100
        : 0;

    // Phase rail structure
    const phaseGroups: { title: string; steps: SetupStep[] }[] = [];
    for (const step of visibleSteps) {
        const phase = STEP_COPY[step].phase;
        const last = phaseGroups[phaseGroups.length - 1];
        if (!last || last.title !== phase) {
            phaseGroups.push({ title: phase, steps: [step] });
        } else {
            last.steps.push(step);
        }
    }

    const handleGenerateGeneralResume = async () => {
        if (!user || !resumeService) {
            onComplete();
            return;
        }
        setIsGeneratingResume(true);
        setGenerationFailed(false);
        setGenerationError(null);
        try {
            await resumeService.generateGeneralResume(user.id);
            toast.success('Your General Resume is ready.');
            onComplete();
        } catch (error) {
            console.error('General resume generation failed:', error);
            const message = error instanceof Error ? error.message : 'Failed to generate resume';
            setGenerationError(message);
            setGenerationFailed(true);
            setIsGeneratingResume(false);
        }
    };

    const handleSkipGeneration = () => {
        toast.info("You can generate your General Resume later from the dashboard.");
        onComplete();
    };

    const handleNext = async () => {
        if (!validateCurrentStep()) return;
        const saved = await saveCurrentStep();
        if (!saved) return;

        if (currentStepIndex < visibleSteps.length - 1) {
            setCurrentStep(visibleSteps[currentStepIndex + 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            try {
                if (user) await profileRepository.markProfileComplete(user.id);
                toast.success("Profile done — let's build your first resume.");
                await handleGenerateGeneralResume();
            } catch (error) {
                console.error('Error completing profile:', error);
                toast.error("We couldn't finish setup. Please try again.");
            }
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(visibleSteps[currentStepIndex - 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const jumpTo = (target: SetupStep) => {
        // Only allow jumping to a step you've already reached or the current one.
        const targetIndex = visibleSteps.indexOf(target);
        if (targetIndex >= 0 && targetIndex <= currentStepIndex) {
            setCurrentStep(target);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // -------------------- Loading state --------------------
    if (loading) {
        return (
            <div className="min-h-screen bg-charcoal-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-700" size={32} />
            </div>
        );
    }

    // -------------------- Generating General Resume --------------------
    if (isGeneratingResume) {
        return (
            <div className="min-h-screen bg-charcoal-50 flex items-center justify-center px-4">
                <div className="max-w-md text-center">
                    <div className="relative mx-auto w-20 h-20 mb-8">
                        <div className="absolute inset-0 border-4 border-charcoal-200 border-t-brand-700 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles size={24} className="text-accent-500 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold mb-3">
                        Your first resume
                    </p>
                    <h2 className="font-display text-3xl font-semibold text-brand-700 leading-tight mb-3">
                        Building your General Resume
                    </h2>
                    <p className="text-brand-500 leading-relaxed">
                        Our AI is drafting a professional, ATS-friendly resume from everything
                        you just shared. About 15–20 seconds.
                    </p>
                </div>
            </div>
        );
    }

    // -------------------- Generation failed --------------------
    if (generationFailed) {
        return (
            <div className="min-h-screen bg-charcoal-50 flex items-center justify-center px-4">
                <div className="bg-white border border-charcoal-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
                    <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <AlertCircle size={22} className="text-red-600" />
                    </div>
                    <h2 className="font-display text-2xl font-semibold text-brand-700 mb-2">
                        Resume generation hit a snag
                    </h2>
                    <p className="text-brand-500 mb-2 leading-relaxed">
                        We couldn't build your General Resume this time. Your profile is saved —
                        you can try again or skip and come back later.
                    </p>
                    {generationError && (
                        <p className="text-sm text-red-700 mb-5 bg-red-50 rounded-lg p-3 text-left border border-red-100">
                            {generationError}
                        </p>
                    )}
                    <div className="flex flex-col gap-2 mt-4">
                        <button
                            type="button"
                            onClick={handleGenerateGeneralResume}
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-700 text-charcoal-50 rounded-full font-semibold hover:bg-brand-800 transition-colors"
                        >
                            <Sparkles size={16} className="text-accent-400" />
                            Try again
                        </button>
                        <button
                            type="button"
                            onClick={handleSkipGeneration}
                            className="w-full px-5 py-3 text-brand-600 hover:text-brand-700 font-semibold hover:bg-charcoal-100 rounded-full transition-colors text-sm"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------- Main wizard --------------------
    const isFirstStep = currentStep === SetupStep.IMPORT_RESUME;
    const isLastStep = currentStepIndex === visibleSteps.length - 1;

    return (
        <div className="min-h-screen bg-charcoal-50 flex flex-col">
            {/* Top bar */}
            <header className="bg-white border-b border-charcoal-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-5 min-w-0">
                        <Wordmark />
                        <span className="hidden sm:block h-5 w-px bg-charcoal-300" />
                        <span className="hidden sm:block text-sm font-medium text-brand-600 truncate">
                            Complete your profile
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isFirstStep && (
                            <div className="hidden sm:block text-xs text-charcoal-500 font-medium tabular-nums">
                                Step {progressIndex} of {progressSteps.length}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => signOut()}
                            className="text-charcoal-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-charcoal-100"
                            title="Sign out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Mobile progress bar */}
                {!isFirstStep && (
                    <div className="lg:hidden px-4 py-3 border-t border-charcoal-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] uppercase tracking-[0.18em] text-accent-600 font-semibold">
                                {STEP_COPY[currentStep].phase}
                            </span>
                            <span className="text-xs font-medium text-charcoal-500 tabular-nums">
                                {progressIndex} / {progressSteps.length}
                            </span>
                        </div>
                        <div className="w-full h-1 bg-charcoal-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent-500 transition-[width] duration-300 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* Main grid */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
                <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
                    {/* Left rail — desktop only */}
                    <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
                        <div className="sticky top-24">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold mb-2">
                                Your profile
                            </p>
                            <h1 className="font-display text-2xl font-semibold text-brand-700 leading-tight mb-6">
                                Set once, reuse everywhere
                            </h1>
                            <p className="text-sm text-brand-500 leading-relaxed mb-8">
                                This becomes the master source every future tailored resume, cover letter,
                                and outreach email is generated from. Take your time — it only happens once.
                            </p>

                            <nav className="space-y-6">
                                {phaseGroups.map((group, gIdx) => {
                                    const groupFurthestIndex = Math.max(
                                        ...group.steps.map(s => visibleSteps.indexOf(s)),
                                    );
                                    const groupStarted = currentStepIndex >= visibleSteps.indexOf(group.steps[0]);
                                    const groupDone = currentStepIndex > groupFurthestIndex &&
                                        group.steps.every(s => stepHasContent(s));

                                    return (
                                        <div key={group.title}>
                                            <div className="flex items-center gap-2.5 mb-3">
                                                <span
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                                                        groupDone
                                                            ? 'bg-brand-700 text-accent-300'
                                                            : groupStarted
                                                                ? 'bg-accent-500 text-brand-800'
                                                                : 'bg-charcoal-200 text-charcoal-500'
                                                    }`}
                                                >
                                                    {groupDone ? <Check size={12} strokeWidth={3} /> : gIdx + 1}
                                                </span>
                                                <span className={`text-[11px] uppercase tracking-[0.22em] font-semibold ${
                                                    groupStarted ? 'text-brand-700' : 'text-charcoal-500'
                                                }`}>
                                                    {group.title}
                                                </span>
                                            </div>
                                            <ul className="ml-3 pl-5 border-l border-charcoal-200 space-y-1.5">
                                                {group.steps.map(step => {
                                                    const idx = visibleSteps.indexOf(step);
                                                    const isCurrent = step === currentStep;
                                                    const isPast = idx < currentStepIndex;
                                                    const clickable = idx <= currentStepIndex;
                                                    const done = isPast && stepHasContent(step);
                                                    return (
                                                        <li key={step}>
                                                            <button
                                                                type="button"
                                                                onClick={() => clickable && jumpTo(step)}
                                                                disabled={!clickable}
                                                                className={`group flex items-center gap-2 text-sm w-full text-left py-1 -ml-[23px] pl-[18px] relative ${
                                                                    isCurrent
                                                                        ? 'text-brand-700 font-semibold'
                                                                        : clickable
                                                                            ? 'text-brand-500 hover:text-brand-700'
                                                                            : 'text-charcoal-400 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-colors ${
                                                                        isCurrent
                                                                            ? 'border-accent-500 bg-accent-500'
                                                                            : done
                                                                                ? 'border-brand-700 bg-brand-700'
                                                                                : 'border-charcoal-300 bg-charcoal-50'
                                                                    }`}
                                                                />
                                                                <span className="truncate">{STEP_COPY[step].label}</span>
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </nav>

                            <div className="mt-10 rounded-2xl bg-brand-700 text-charcoal-100 p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText size={14} className="text-accent-400" />
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-accent-400 font-semibold">
                                        Already have a resume?
                                    </p>
                                </div>
                                <p className="text-sm text-charcoal-200 leading-relaxed mb-3">
                                    Upload your existing PDF and we'll prefill everything below. You can
                                    edit anything after.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(SetupStep.IMPORT_RESUME)}
                                    className="text-sm text-accent-300 hover:text-accent-200 font-semibold inline-flex items-center gap-1 transition-colors"
                                >
                                    Import resume
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Right content */}
                    <main className="lg:col-span-8 xl:col-span-9 pb-24">
                        <div className="bg-white border border-charcoal-200 rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10">
                            {renderCurrentStep()}
                        </div>
                    </main>
                </div>
            </div>

            {/* Sticky bottom navigation — hidden on the import step, where
                ResumeUploadStep has its own primary/secondary actions. */}
            {!isFirstStep && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-charcoal-200 z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={currentStepIndex === 0 || saving}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:bg-charcoal-100 rounded-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronLeft size={16} />
                            Back
                        </button>

                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-700 text-charcoal-50 rounded-full font-semibold text-sm hover:bg-brand-800 disabled:bg-charcoal-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Saving
                                </>
                            ) : isLastStep ? (
                                <>
                                    Finish & build resume
                                    <Sparkles size={16} className="text-accent-400" />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
