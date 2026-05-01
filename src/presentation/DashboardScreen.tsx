import React, { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    FileText,
    User,
    MoreVertical,
    Search,
    Loader2,
    Trash,
    ArrowRight,
    Lock,
    LogOut,
    CheckCircle2,
    Sparkles,
    Briefcase,
} from 'lucide-react';
import { useAuth } from '../infrastructure/auth/AuthContext';
import { createResumeService, applicationRepository } from '../infrastructure/config/dependencies';
import { Application } from '../domain/repositories/IApplicationRepository';
import { ResumeService } from '../application/services/ResumeService';
import { toast } from 'sonner';

interface Props {
    onCreateNew: () => void;
    onEditProfile: () => void;
    onOpenApplication: (id: string) => void;
    onOpenResume?: (id: string, data?: any) => void;
}

type ResumeListItem = { id: string; title: string; date: string; updatedAt?: string; company?: string };

const Wordmark = () => (
    <div className="flex items-baseline gap-1.5 select-none">
        <span className="font-display text-lg font-semibold tracking-tight text-brand-700">TOP</span>
        <span className="font-display text-lg font-semibold tracking-tight text-accent-500">CANDIDATE</span>
    </div>
);

const formatRelative = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const diffMs = Date.now() - d.getTime();
    const sec = Math.round(diffMs / 1000);
    if (sec < 60) return 'just now';
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.round(hr / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
};

export const DashboardScreen = ({ onCreateNew, onEditProfile, onOpenApplication, onOpenResume }: Props) => {
    const { user, signOut } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [resumes, setResumes] = useState<ResumeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [buildingMaster, setBuildingMaster] = useState(false);

    useEffect(() => {
        if (user) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadData = async () => {
        try {
            if (!user) return;
            const resumeService = createResumeService();
            const [apps, resumeList] = await Promise.all([
                applicationRepository.getApplications(user.id),
                resumeService.getGeneratedResumes(user.id),
            ]);
            setApplications(apps);
            setResumes(resumeList);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this application toolkit? This cannot be undone.')) return;
        try {
            const resumeService = createResumeService();
            await resumeService.deleteGeneratedResume(id);
            setResumes(prev => prev.filter(r => r.id !== id));
            toast.success('Deleted');
        } catch (error) {
            console.error('Failed to delete resume:', error);
            toast.error('Failed to delete');
        }
        setActiveMenuId(null);
    };

    const handleBuildMaster = async () => {
        if (!user || buildingMaster) return;
        setBuildingMaster(true);
        try {
            const resumeService = createResumeService();
            const id = await resumeService.generateGeneralResume(user.id);
            toast.success('Master resume ready');
            onOpenResume?.(id);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || 'Could not build master resume');
            setBuildingMaster(false);
        }
    };

    const generalResume = useMemo(
        () => resumes.find(r => r.title === ResumeService.GENERAL_RESUME_TITLE) ?? null,
        [resumes],
    );
    const tailoredResumes = useMemo(
        () => resumes.filter(r => r.title !== ResumeService.GENERAL_RESUME_TITLE),
        [resumes],
    );

    const filteredTailored = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return tailoredResumes;
        return tailoredResumes.filter(r =>
            r.title.toLowerCase().includes(q) ||
            (r.company ?? '').toLowerCase().includes(q),
        );
    }, [tailoredResumes, searchTerm]);

    const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0]
        ?? user?.email?.split('@')[0]
        ?? 'there';

    const masterUpdatedAt = generalResume?.updatedAt ?? generalResume?.date;

    return (
        <div className="min-h-screen bg-paper flex flex-col">
            {/* Top nav */}
            <header className="bg-paper/90 backdrop-blur-md border-b border-charcoal-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Wordmark />
                    <div className="relative flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setProfileMenuOpen(v => !v)}
                            className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white border border-charcoal-200 hover:border-charcoal-300 transition-colors"
                            aria-label="Account menu"
                        >
                            <span className="w-7 h-7 rounded-full bg-brand-700 text-charcoal-50 text-xs font-semibold flex items-center justify-center">
                                {firstName.charAt(0).toUpperCase()}
                            </span>
                            <span className="hidden sm:inline text-sm font-medium text-brand-700 max-w-[140px] truncate">
                                {firstName}
                            </span>
                        </button>

                        {profileMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setProfileMenuOpen(false)}
                                    aria-hidden
                                />
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-charcoal-200 py-1 z-40">
                                    <div className="px-4 py-3 border-b border-charcoal-100">
                                        <p className="text-xs text-charcoal-500">Signed in as</p>
                                        <p className="text-sm font-medium text-brand-700 truncate">{user?.email}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileMenuOpen(false);
                                            onEditProfile();
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-brand-700 hover:bg-charcoal-50 transition-colors"
                                    >
                                        <User size={16} /> My profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileMenuOpen(false);
                                            signOut();
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={16} /> Sign out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main
                className="flex-1 w-full"
                onClick={() => setActiveMenuId(null)}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-14 pb-12 lg:pb-16">
                    {/* Greeting */}
                    <div className="mb-8 lg:mb-10">
                        <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-brand-700">
                            Hi <span className="italic text-accent-500">{firstName}</span>. What are we working on?
                        </h1>
                        <p className="mt-2 text-brand-500">
                            Pick one of the two paths below.
                        </p>
                    </div>

                    {/* Two-card primary action zone */}
                    <div className="grid lg:grid-cols-2 gap-4 lg:gap-5 mb-12 lg:mb-16">
                        {/* Card A — Tailor for a job (primary, dark) */}
                        <button
                            type="button"
                            onClick={onCreateNew}
                            className="group text-left relative bg-brand-700 hover:bg-brand-800 transition-colors rounded-2xl p-7 sm:p-8 flex flex-col min-h-[260px]"
                        >
                            <span className="text-[11px] uppercase tracking-[0.22em] text-accent-400 font-semibold">
                                Tailor for a job
                            </span>
                            <h2 className="mt-3 font-display text-2xl sm:text-[26px] font-semibold leading-snug text-charcoal-50">
                                I have a job description
                            </h2>
                            <p className="mt-2 text-[15px] leading-relaxed text-charcoal-300">
                                Paste the JD. We'll build a resume, cover letter, outreach email, LinkedIn note, and interview prep — all matched to that role.
                            </p>
                            <div className="mt-auto pt-6 inline-flex items-center gap-2 self-start px-5 py-3 bg-accent-400 text-brand-800 rounded-full text-sm font-semibold group-hover:bg-accent-300 transition-colors">
                                <Plus size={16} />
                                Start new application
                            </div>
                        </button>

                        {/* Card B — Master resume */}
                        {generalResume ? (
                            <button
                                type="button"
                                onClick={() => onOpenResume?.(generalResume.id)}
                                className="group text-left relative bg-white hover:border-brand-700 hover:shadow-md transition-all border border-charcoal-200 rounded-2xl p-7 sm:p-8 flex flex-col min-h-[260px]"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold">
                                        Your master resume
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-600 bg-charcoal-50 border border-charcoal-200 rounded-full px-2.5 py-1">
                                        <CheckCircle2 size={12} className="text-accent-500" />
                                        Ready
                                    </span>
                                </div>
                                <h2 className="mt-3 font-display text-2xl sm:text-[26px] font-semibold leading-snug text-brand-700">
                                    My one-size-fits-all resume
                                </h2>
                                <p className="mt-2 text-[15px] leading-relaxed text-brand-500">
                                    Built from your profile. Use it when you don't have a target role yet, or as a starting point.
                                </p>
                                <div className="mt-auto pt-6 flex items-center justify-between">
                                    <span className="text-xs text-charcoal-500">
                                        {masterUpdatedAt ? `Updated ${formatRelative(masterUpdatedAt)}` : 'Up to date'}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 group-hover:text-accent-600 transition-colors">
                                        Open resume
                                        <ArrowRight size={16} />
                                    </span>
                                </div>
                            </button>
                        ) : (
                            <div className="relative bg-white border border-dashed border-charcoal-300 rounded-2xl p-7 sm:p-8 flex flex-col min-h-[260px]">
                                <span className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold">
                                    Your master resume
                                </span>
                                <h2 className="mt-3 font-display text-2xl sm:text-[26px] font-semibold leading-snug text-brand-700">
                                    Build your evergreen resume
                                </h2>
                                <p className="mt-2 text-[15px] leading-relaxed text-brand-500">
                                    A one-size-fits-all resume built from your profile. Use it when you don't have a target role yet.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleBuildMaster}
                                    disabled={buildingMaster}
                                    className="mt-auto pt-6 inline-flex items-center gap-2 self-start px-5 py-3 bg-brand-700 text-charcoal-50 rounded-full text-sm font-semibold hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {buildingMaster ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Building…
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            Build it from my profile
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tailored applications list */}
                    <section>
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                            <div>
                                <h2 className="font-display text-2xl font-semibold text-brand-700 leading-tight">
                                    Your applications
                                </h2>
                                <p className="text-sm text-brand-500 mt-1">
                                    {tailoredResumes.length === 0
                                        ? 'Tailored toolkits show up here once you build them.'
                                        : `${tailoredResumes.length} ${tailoredResumes.length === 1 ? 'application' : 'applications'} so far.`}
                                </p>
                            </div>

                            {tailoredResumes.length > 0 && (
                                <div className="relative sm:w-72">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by role or company"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-charcoal-200 rounded-full text-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500 transition-colors outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="animate-spin text-brand-600" size={28} />
                            </div>
                        ) : tailoredResumes.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-charcoal-200 px-6 py-12 text-center">
                                <div className="w-12 h-12 mx-auto rounded-full bg-accent-50 border border-accent-100 flex items-center justify-center mb-4">
                                    <Briefcase className="text-accent-600" size={20} />
                                </div>
                                <h3 className="font-display text-lg font-semibold text-brand-700 mb-1.5">
                                    No applications yet
                                </h3>
                                <p className="text-sm text-brand-500 max-w-md mx-auto">
                                    Use <span className="font-semibold text-brand-700">Start new application</span> above to tailor a toolkit for a specific job.
                                </p>
                            </div>
                        ) : filteredTailored.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-charcoal-200 px-6 py-10 text-center">
                                <p className="text-sm text-brand-500">
                                    No applications match "{searchTerm}".
                                </p>
                            </div>
                        ) : (
                            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTailored.map(resume => {
                                    const displayTitle = resume.title.replace(/ Resume$/i, '').replace(/Resume$/i, '').trim() || 'Untitled role';
                                    return (
                                        <li
                                            key={resume.id}
                                            className="relative bg-white rounded-2xl border border-charcoal-200 p-5 hover:border-brand-700 hover:shadow-md transition-all cursor-pointer group"
                                            onClick={() => onOpenResume?.(resume.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-charcoal-50 border border-charcoal-200 text-brand-700 flex items-center justify-center shrink-0 group-hover:bg-accent-50 group-hover:border-accent-200 group-hover:text-accent-600 transition-colors">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-display text-[17px] font-semibold text-brand-700 leading-snug line-clamp-2">
                                                        {displayTitle}
                                                    </h3>
                                                    {resume.company && (
                                                        <p className="text-sm text-charcoal-500 mt-0.5 line-clamp-1">{resume.company}</p>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        aria-label="Application actions"
                                                        className="text-charcoal-400 hover:text-brand-700 p-1.5 -mr-1.5 rounded-full hover:bg-charcoal-50 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === resume.id ? null : resume.id);
                                                        }}
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>

                                                    {activeMenuId === resume.id && (
                                                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-charcoal-200 py-1 z-20">
                                                            <button
                                                                type="button"
                                                                className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                onClick={(e) => handleDeleteResume(resume.id, e)}
                                                            >
                                                                <Trash size={15} className="mr-2" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-5 pt-4 border-t border-charcoal-100 flex items-center justify-between text-xs">
                                                <span className="text-charcoal-500">
                                                    Built {formatRelative(resume.updatedAt ?? resume.date)}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-brand-600 font-semibold group-hover:text-accent-600 transition-colors">
                                                    Open
                                                    <ArrowRight size={13} />
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {/* Mock interviews — slim teaser */}
                    <aside className="mt-12 lg:mt-16 bg-white border border-charcoal-200 rounded-2xl px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-charcoal-50 border border-charcoal-200 flex items-center justify-center text-brand-600 shrink-0">
                                <Lock size={15} />
                            </span>
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold">
                                    Coming soon
                                </p>
                                <p className="text-sm text-brand-700 font-medium mt-0.5">
                                    Mock interviews with senior practitioners who actually do the hiring.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled
                            className="text-sm font-semibold text-charcoal-500 bg-charcoal-50 border border-charcoal-200 rounded-full px-4 py-2 cursor-not-allowed shrink-0"
                            title="Booking opens soon"
                        >
                            Notify me
                        </button>
                    </aside>

                    {/* Legacy applications (only shown if real legacy data exists) */}
                    {applications.length > 0 && (
                        <section className="mt-12">
                            <h2 className="font-display text-lg font-semibold text-brand-700 mb-4">
                                Older tracked applications
                            </h2>
                            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {applications.map(app => (
                                    <li key={app.id}>
                                        <button
                                            type="button"
                                            onClick={() => onOpenApplication(app.id)}
                                            className="w-full text-left bg-white rounded-2xl border border-charcoal-200 p-5 hover:border-brand-700 hover:shadow-md transition-all"
                                        >
                                            <h3 className="font-display text-base font-semibold text-brand-700 line-clamp-1">{app.jobTitle}</h3>
                                            <p className="text-sm text-charcoal-500 mt-1 line-clamp-1">{app.companyName}</p>
                                            <p className="text-xs text-charcoal-500 mt-3">
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </main>

            <footer className="border-t border-charcoal-200 bg-charcoal-50 py-6">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-brand-500">
                    <Wordmark />
                    <p>&copy; {new Date().getFullYear()} TOP CANDIDATE · The complete toolkit to land the job.</p>
                </div>
            </footer>
        </div>
    );
};
