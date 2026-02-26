// Profile Setup Screen - Multi-step wizard for new users to complete their profile

import React, { useState, useEffect } from 'react';
import { useAuth } from '../infrastructure/auth/AuthContext';
import { profileRepository } from '../infrastructure/config/dependencies';
import { toast } from 'sonner';
import {
    UserTypeStep,
    PersonalInfoStep,
    ExperienceStep,
    ProjectsStep,
    SkillsStep,
    EducationStep
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
    Publication
} from '../domain/entities/Resume';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Loader2,
    User,
    Briefcase,
    GraduationCap,
    FolderGit2,
    Sparkles,
    Calendar,
    Award as AwardIcon,
    BookOpen,
    Users,
    LogOut,
    FileText
} from 'lucide-react';
import {
    ExtracurricularStep,
    AwardsStep,
    CertificationsStep,
    AffiliationsStep,
    PublicationsStep
} from './components/FormSteps';
import { ResumeUploadStep } from './components/profile/ResumeUploadStep';
import { ExtractedProfileData } from '../domain/usecases/ExtractResumeUseCase';

interface Props {
    onComplete: () => void;
}

enum SetupStep {
    IMPORT_RESUME = -1,
    USER_TYPE = 0,
    PERSONAL_INFO = 1,
    EXPERIENCE_OR_PROJECTS = 2,
    SKILLS = 3,
    EXTRACURRICULARS = 4,
    AWARDS = 5,
    CERTIFICATIONS = 6,
    AFFILIATIONS = 7,
    PUBLICATIONS = 8,
}

const STEP_LABELS = {
    [SetupStep.IMPORT_RESUME]: 'Import',
    [SetupStep.USER_TYPE]: 'User Type',
    [SetupStep.PERSONAL_INFO]: 'Personal Info',
    [SetupStep.EXPERIENCE_OR_PROJECTS]: 'Experience/Projects', // Dynamic
    [SetupStep.SKILLS]: 'Skills',
    [SetupStep.EXTRACURRICULARS]: 'Activities',
    [SetupStep.AWARDS]: 'Awards',
    [SetupStep.CERTIFICATIONS]: 'Certifications',
    [SetupStep.AFFILIATIONS]: 'Affiliations',
    [SetupStep.PUBLICATIONS]: 'Publications',
};

export const ProfileSetupScreen: React.FC<Props> = ({ onComplete }) => {
    const { user, signOut } = useAuth();
    const [currentStep, setCurrentStep] = useState(SetupStep.IMPORT_RESUME);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form data
    const [userType, setUserType] = useState<UserType | undefined>(undefined);
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
        fullName: '',
        email: '',
        phone: '',
        location: '',
    });
    const [experiences, setExperiences] = useState<WorkExperience[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    const [skills, setSkills] = useState<string[]>([]);
    const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
    const [awards, setAwards] = useState<Award[]>([]);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
    const [publications, setPublications] = useState<Publication[]>([]);

    // Load existing data on mount
    useEffect(() => {
        if (user?.id) {
            loadExistingData();
        }
    }, [user?.id]);

    const loadExistingData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [profile, exps, projs, skls, uType, extras, awds, certs, affs, pubs] = await Promise.all([
                profileRepository.getProfile(user.id),
                profileRepository.getExperiences(user.id),
                profileRepository.getProjects(user.id),
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
            if (skls.length > 0) setSkills(skls);
            if (uType) setUserType(uType);
            if (extras.length > 0) setExtracurriculars(extras);
            if (awds.length > 0) setAwards(awds);
            if (certs.length > 0) setCertifications(certs);
            if (affs.length > 0) setAffiliations(affs);
            if (pubs.length > 0) setPublications(pubs);

            // Determine appropriate step to restore
            let nextStep = SetupStep.IMPORT_RESUME;

            if (uType) {
                // Determine visible steps logic inline (since state not updated yet)
                const allSteps = [
                    SetupStep.IMPORT_RESUME,
                    SetupStep.USER_TYPE,
                    SetupStep.PERSONAL_INFO,
                    SetupStep.EXPERIENCE_OR_PROJECTS,
                    SetupStep.SKILLS
                ];
                if (uType === 'student') {
                    allSteps.push(SetupStep.EXTRACURRICULARS, SetupStep.AWARDS);
                } else {
                    allSteps.push(SetupStep.CERTIFICATIONS, SetupStep.AFFILIATIONS, SetupStep.PUBLICATIONS);
                }

                if (profile?.fullName && profile?.email) {
                    nextStep = SetupStep.EXPERIENCE_OR_PROJECTS;

                    const hasExperience = uType === 'experienced' && exps.length > 0;
                    const hasProjects = uType === 'student' && projs.length > 0;

                    if (hasExperience || hasProjects) {
                        nextStep = SetupStep.SKILLS;

                        if (skls.length > 0) {
                            // Move to next sections based on user type
                            if (uType === 'student') {
                                nextStep = SetupStep.EXTRACURRICULARS;
                                if (extras.length > 0) nextStep = SetupStep.AWARDS;
                                if (extras.length > 0 && awds.length > 0) nextStep = SetupStep.AWARDS; // Stay on last step if all done? Or just stay on last one.
                            } else {
                                nextStep = SetupStep.CERTIFICATIONS;
                                if (certs.length > 0) nextStep = SetupStep.AFFILIATIONS;
                                if (certs.length > 0 && affs.length > 0) nextStep = SetupStep.PUBLICATIONS;
                            }
                        }
                    } else {
                        // Stay on Experience/Projects
                        nextStep = SetupStep.EXPERIENCE_OR_PROJECTS;
                    }
                } else {
                    nextStep = SetupStep.PERSONAL_INFO;
                }
            }

            setCurrentStep(nextStep);

        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStepLabel = (step: SetupStep): string => {
        if (step === SetupStep.EXPERIENCE_OR_PROJECTS) {
            return userType === 'student' ? 'Projects' : 'Experience';
        }
        return STEP_LABELS[step];
    };

    const getStepIcon = (step: SetupStep) => {
        switch (step) {
            case SetupStep.IMPORT_RESUME: return <FileText size={18} />;
            case SetupStep.USER_TYPE: return <User size={18} />;
            case SetupStep.PERSONAL_INFO: return <User size={18} />;
            case SetupStep.EXPERIENCE_OR_PROJECTS:
                return userType === 'student' ? <FolderGit2 size={18} /> : <Briefcase size={18} />;
            case SetupStep.SKILLS: return <Sparkles size={18} />;
            case SetupStep.EXTRACURRICULARS: return <Users size={18} />;
            case SetupStep.AWARDS: return <AwardIcon size={18} />;
            case SetupStep.CERTIFICATIONS: return <AwardIcon size={18} />;
            case SetupStep.AFFILIATIONS: return <Users size={18} />;
            case SetupStep.PUBLICATIONS: return <BookOpen size={18} />;
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
                if (!userType) {
                    showError('Please select your user type');
                    return false;
                }
                return true;

            case SetupStep.PERSONAL_INFO:
                if (!(personalInfo.fullName || '').trim()) {
                    showError('Please enter your full name');
                    return false;
                }
                if (!(personalInfo.email || '').trim()) {
                    showError('Please enter your email');
                    return false;
                }
                return true;

            case SetupStep.EXPERIENCE_OR_PROJECTS:
                if (userType === 'experienced' && experiences.length === 0) {
                    showError('Please add at least one work experience');
                    return false;
                }
                if (userType === 'student' && projects.length === 0) {
                    showError('Please add at least one project');
                    return false;
                }

                if (userType === 'experienced') {
                    for (const exp of experiences) {
                        if (!(exp.company || '').trim() || !(exp.role || '').trim()) {
                            showError('Please fill in company and role for all experiences');
                            return false;
                        }
                        if (!(exp.startDate || '').trim() || (!exp.isCurrent && !(exp.endDate || '').trim())) {
                            showError('Please provide start and end dates for all experiences');
                            return false;
                        }
                        if (!(exp.rawDescription || '').trim()) {
                            showError('Please provide a description for all experiences');
                            return false;
                        }
                    }
                } else {
                    for (const proj of projects) {
                        if (!(proj.name || '').trim()) {
                            showError('Please fill in name for all projects');
                            return false;
                        }
                        if (!proj.technologies || proj.technologies.length === 0 || !(proj.technologies.join('') || '').trim()) {
                            showError('Please add at least one technology for all projects');
                            return false;
                        }
                        if (!(proj.rawDescription || '').trim()) {
                            showError('Please provide a description for all projects');
                            return false;
                        }
                    }
                }
                return true;

            case SetupStep.SKILLS:
                if (skills.length === 0) {
                    showError('Please add at least one skill');
                    return false;
                }
                return true;

            case SetupStep.EXTRACURRICULARS:
                for (const item of extracurriculars) {
                    if (!(item.title || '').trim() || !(item.organization || '').trim()) {
                        showError('Please fill in role and organization for all activities');
                        return false;
                    }
                    if (!(item.startDate || '').trim() || !(item.endDate || '').trim()) {
                        showError('Please provide start and end dates for all activities');
                        return false;
                    }
                }
                return true;

            case SetupStep.AWARDS:
                for (const item of awards) {
                    if (!(item.title || '').trim() || !(item.issuer || '').trim()) {
                        showError('Please fill in title and issuer for all awards');
                        return false;
                    }
                    if (!(item.date || '').trim()) {
                        showError('Please provide a date for all awards');
                        return false;
                    }
                }
                return true;

            case SetupStep.CERTIFICATIONS:
                for (const item of certifications) {
                    if (!(item.name || '').trim() || !(item.issuer || '').trim()) {
                        showError('Please fill in name and issuer for all certifications');
                        return false;
                    }
                    if (!(item.date || '').trim()) {
                        showError('Please provide a date for all certifications');
                        return false;
                    }
                }
                return true;

            case SetupStep.AFFILIATIONS:
                for (const item of affiliations) {
                    if (!(item.organization || '').trim() || !(item.role || '').trim()) {
                        showError('Please fill in organization and role for all affiliations');
                        return false;
                    }
                    if (!(item.startDate || '').trim() || !(item.endDate || '').trim()) {
                        showError('Please provide start and end dates for all affiliations');
                        return false;
                    }
                }
                return true;

            case SetupStep.PUBLICATIONS:
                for (const item of publications) {
                    if (!(item.title || '').trim() || !(item.publisher || '').trim()) {
                        showError('Please fill in title and publisher for all publications');
                        return false;
                    }
                    if (!(item.date || '').trim()) {
                        showError('Please provide a date for all publications');
                        return false;
                    }
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
                    if (userType) {
                        await profileRepository.saveUserType(user.id, userType);
                    }
                    break;

                case SetupStep.PERSONAL_INFO:
                    await profileRepository.saveProfile(user.id, personalInfo);
                    break;

                case SetupStep.EXPERIENCE_OR_PROJECTS:
                    if (userType === 'experienced') {
                        for (const exp of experiences) {
                            await profileRepository.saveExperience(user.id, exp);
                        }
                    } else {
                        for (const proj of projects) {
                            await profileRepository.saveProject(user.id, proj);
                        }
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
            toast.error('Failed to save. Please try again.');
            return false;
        } finally {
            setSaving(false);
        }
    };



    const handleExtracted = (data: ExtractedProfileData) => {
        if (data.userType) setUserType(data.userType);
        if (data.personalInfo) {
            // Fill in missing properties manually to satisfy TypeScript if data.personalInfo is Partial
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
        if (data.experience && data.experience.length > 0) setExperiences(data.experience);
        if (data.projects && data.projects.length > 0) setProjects(data.projects);
        if (data.skills && data.skills.length > 0) setSkills(data.skills);
        if (data.extracurriculars && data.extracurriculars.length > 0) setExtracurriculars(data.extracurriculars);
        if (data.awards && data.awards.length > 0) setAwards(data.awards);
        if (data.certifications && data.certifications.length > 0) setCertifications(data.certifications);
        if (data.affiliations && data.affiliations.length > 0) setAffiliations(data.affiliations);
        if (data.publications && data.publications.length > 0) setPublications(data.publications);

        // Move to the next step
        setCurrentStep(SetupStep.USER_TYPE);
    };

    const handleSkipImport = () => {
        setCurrentStep(SetupStep.USER_TYPE);
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case SetupStep.IMPORT_RESUME:
                return <ResumeUploadStep onExtracted={handleExtracted} onSkip={handleSkipImport} />;

            case SetupStep.USER_TYPE:
                return <UserTypeStep userType={userType} update={setUserType} />;

            case SetupStep.PERSONAL_INFO:
                return <PersonalInfoStep data={personalInfo} update={setPersonalInfo} />;

            case SetupStep.EXPERIENCE_OR_PROJECTS:
                if (userType === 'student') {
                    return <ProjectsStep data={projects} update={setProjects} />;
                }
                return <ExperienceStep data={experiences} update={setExperiences} />;

            case SetupStep.SKILLS:
                return <SkillsStep data={skills} update={setSkills} />;

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

    const getVisibleSteps = () => {
        const allSteps = [
            SetupStep.IMPORT_RESUME,
            SetupStep.USER_TYPE,
            SetupStep.PERSONAL_INFO,
            SetupStep.EXPERIENCE_OR_PROJECTS,
            SetupStep.SKILLS
        ];

        if (userType === 'student') {
            allSteps.push(SetupStep.EXTRACURRICULARS, SetupStep.AWARDS);
        } else if (userType === 'experienced') {
            allSteps.push(SetupStep.CERTIFICATIONS, SetupStep.AFFILIATIONS, SetupStep.PUBLICATIONS);
        }
        return allSteps;
    };

    // Replace currentStep navigation logic
    const visibleSteps = getVisibleSteps();
    const currentStepIndex = visibleSteps.indexOf(currentStep);

    // Total steps for progress
    const totalSteps = visibleSteps.length;
    const progress = ((currentStepIndex + 1) / totalSteps) * 100;

    // Override handlers 
    const handleNext = async () => {
        if (!validateCurrentStep()) return;

        const saved = await saveCurrentStep();
        if (!saved) return;

        if (currentStepIndex < visibleSteps.length - 1) {
            setCurrentStep(visibleSteps[currentStepIndex + 1]);
        } else {
            // Mark profile as complete
            try {
                await profileRepository.markProfileComplete(user.id);
                toast.success('Profile setup complete!');
                onComplete();
            } catch (error) {
                console.error('Error completing profile:', error);
                toast.error('Failed to complete setup. Please try again.');
            }
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(visibleSteps[currentStepIndex - 1]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">Complete Your Profile</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500 hidden sm:block">
                            Step {currentStepIndex + 1} of {totalSteps}
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-gray-200">
                <div
                    className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Step Indicators */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
                <div className="overflow-x-auto py-4 scrollbar-hide">
                    <div className="flex items-center min-w-full sm:justify-between px-1">
                        {visibleSteps.map((step, idx) => (
                            <React.Fragment key={step}>
                                <div className="flex flex-col items-center flex-shrink-0 z-10">
                                    <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 border-2 ${currentStep === step
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-110'
                                        : visibleSteps.indexOf(currentStep) > idx
                                            ? 'bg-green-500 text-white border-green-500'
                                            : 'bg-white text-gray-300 border-gray-200'
                                        }`}>
                                        {visibleSteps.indexOf(currentStep) > idx ? (
                                            <CheckCircle2 size={24} />
                                        ) : (
                                            getStepIcon(step)
                                        )}
                                    </div>
                                    <span className={`text-xs font-medium mt-3 whitespace-nowrap px-2 transition-colors duration-300 ${currentStep === step
                                        ? 'text-indigo-700 font-bold'
                                        : visibleSteps.indexOf(currentStep) > idx
                                            ? 'text-green-600'
                                            : 'text-gray-400'
                                        }`}>
                                        {getStepLabel(step)}
                                    </span>
                                </div>
                                {idx < visibleSteps.length - 1 && (
                                    <div className={`h-0.5 w-16 sm:w-full min-w-[3rem] -mt-8 mx-2 transition-all duration-500 ${visibleSteps.indexOf(currentStep) > idx ? 'bg-green-500' : 'bg-gray-200'
                                        }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-32">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    {renderCurrentStep()}
                </div>
            </main>

            {/* Fixed Bottom Navigation */}
            {currentStep !== SetupStep.IMPORT_RESUME && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-4">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            disabled={currentStepIndex === 0 || saving}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                            Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={saving || !validateCurrentStep(false)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:text-gray-100 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Saving...
                                </>
                            ) : currentStepIndex === visibleSteps.length - 1 ? (
                                <>
                                    Complete Setup
                                    <CheckCircle2 size={18} />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
