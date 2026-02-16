import React, { useEffect, useState } from 'react';
import { useAuth } from '../infrastructure/auth/AuthContext';
import { profileRepository } from '../infrastructure/config/dependencies';
import {
    PersonalInfo, WorkExperience, Education, Project,
    Extracurricular, Award, Certification, Affiliation, Publication,
    UserType
} from '../domain/entities/Resume';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { ExperienceSection } from './components/profile/ExperienceSection';
import { ProjectSection } from './components/profile/ProjectSection';
import { EducationSection } from './components/profile/EducationSection';
import { SkillSection } from './components/profile/SkillSection';
import { ExtracurricularSection } from './components/profile/ExtracurricularSection';
import { AwardSection } from './components/profile/AwardSection';
import { CertificationSection } from './components/profile/CertificationSection';
import { AffiliationSection } from './components/profile/AffiliationSection';
import { PublicationSection } from './components/profile/PublicationSection';

const Tabs = [
    'Personal',
    'Experience',
    'Projects',
    'Education',
    'Skills',
    'Activities',
    'Awards',
    'Certifications',
    'Affiliations',
    'Publications'
];

export const ProfileScreen = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Personal');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State for each section
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({ fullName: '', email: '', phone: '', location: '' });
    const [userType, setUserType] = useState<UserType | undefined>();
    const [experiences, setExperiences] = useState<WorkExperience[]>([]);
    const [educations, setEducations] = useState<Education[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [skills, setSkills] = useState<string[]>([]);
    const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
    const [awards, setAwards] = useState<Award[]>([]);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
    const [publications, setPublications] = useState<Publication[]>([]);

    useEffect(() => {
        if (user?.id) {
            loadProfileData();
        }
    }, [user?.id]);

    const loadProfileData = async () => {
        // Only show full page loader if we haven't loaded anything yet
        if (!personalInfo.email) {
            setLoading(true);
        }

        try {
            if (!user) return;

            const [pInfo, uType, exps, edus, projs, skls, extras, awds, certs, affs, pubs] = await Promise.all([
                profileRepository.getProfile(user.id),
                profileRepository.getUserType(user.id),
                profileRepository.getExperiences(user.id),
                profileRepository.getEducations(user.id),
                profileRepository.getProjects(user.id),
                profileRepository.getSkills(user.id),
                profileRepository.getExtracurriculars(user.id),
                profileRepository.getAwards(user.id),
                profileRepository.getCertifications(user.id),
                profileRepository.getAffiliations(user.id),
                profileRepository.getPublications(user.id),
            ]);

            if (pInfo) setPersonalInfo(pInfo);
            if (uType) setUserType(uType);
            setExperiences(exps);
            setEducations(edus);
            setProjects(projs);
            setSkills(skls);
            setExtracurriculars(extras);
            setAwards(awds);
            setCertifications(certs);
            setAffiliations(affs);
            setPublications(pubs);

        } catch (error) {
            console.error(error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePersonal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await profileRepository.saveProfile(user.id, personalInfo);
            toast.success('Personal info saved');
        } catch (error) {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Your Master Profile</h1>
            <p className="text-gray-500 mb-8">
                Manage your core information here. When you create a new resume, we'll pull from this data.
            </p>

            <div className="flex gap-2 overflow-x-auto mb-8 border-b border-gray-200 pb-1 scrollbar-hide">
                {Tabs.map(tab => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {activeTab === 'Personal' && (
                    <form onSubmit={handleSavePersonal} className="space-y-4 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={personalInfo.fullName}
                                    onChange={e => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={personalInfo.email}
                                    disabled
                                    className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={personalInfo.phone}
                                    onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={personalInfo.location}
                                    onChange={e => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                                <input
                                    type="text"
                                    value={personalInfo.linkedin || ''}
                                    onChange={e => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio/Website</label>
                                <input
                                    type="text"
                                    value={personalInfo.website || ''}
                                    onChange={e => setPersonalInfo({ ...personalInfo, website: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Personal Info
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'Experience' && <ExperienceSection experiences={experiences} onRefresh={loadProfileData} />}
                {activeTab === 'Projects' && <ProjectSection projects={projects} onRefresh={loadProfileData} />}
                {activeTab === 'Education' && <EducationSection educations={educations} onRefresh={loadProfileData} />}
                {activeTab === 'Skills' && <SkillSection skills={skills} onRefresh={loadProfileData} />}
                {activeTab === 'Activities' && <ExtracurricularSection items={extracurriculars} onRefresh={loadProfileData} />}
                {activeTab === 'Awards' && <AwardSection items={awards} onRefresh={loadProfileData} />}
                {activeTab === 'Certifications' && <CertificationSection items={certifications} onRefresh={loadProfileData} />}
                {activeTab === 'Affiliations' && <AffiliationSection items={affiliations} onRefresh={loadProfileData} />}
                {activeTab === 'Publications' && <PublicationSection items={publications} onRefresh={loadProfileData} />}
            </div>
        </div>
    );
};
