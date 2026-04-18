import React, { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    FileText,
    User,
    MoreVertical,
    Calendar,
    Search,
    Loader2,
    Trash,
    Sparkles,
    ArrowRight,
    Star,
    Lock,
    MessageSquare,
    Mail,
    Linkedin,
    LogOut,
    Target,
    Clock,
    CheckCircle2,
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

const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold">
        {children}
    </p>
);

const Wordmark = () => (
    <div className="flex items-baseline gap-1.5 select-none">
        <span className="font-display text-lg font-semibold tracking-tight text-brand-700">TOP</span>
        <span className="font-display text-lg font-semibold tracking-tight text-accent-500">CANDIDATE</span>
    </div>
);

const consultantPlaceholders = [
    {
        name: 'Engineering Manager',
        focus: 'Senior + Staff Software Engineer mocks',
        signal: 'Hires at series-B startups',
        rate: '$120 / 60 min',
        rating: 4.9,
        sessions: 142,
        initials: 'EM',
    },
    {
        name: 'Director of Product',
        focus: 'Group PM and PM mocks',
        signal: 'Reviewer at FAANG + growth cos',
        rate: '$160 / 60 min',
        rating: 5.0,
        sessions: 88,
        initials: 'DP',
    },
    {
        name: 'Head of Design',
        focus: 'Senior Product Designer mocks',
        signal: 'Hires designers at consumer scale-ups',
        rate: '$140 / 60 min',
        rating: 4.8,
        sessions: 67,
        initials: 'HD',
    },
];

const formatRelative = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const diffMs = Date.now() - d.getTime();
    const sec = Math.round(diffMs / 1000);
    if (sec < 60) return 'Just now';
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
        if (!confirm('Delete this toolkit? This cannot be undone.')) return;
        try {
            const resumeService = createResumeService();
            await resumeService.deleteGeneratedResume(id);
            setResumes(prev => prev.filter(r => r.id !== id));
            toast.success('Toolkit deleted');
        } catch (error) {
            console.error('Failed to delete resume:', error);
            toast.error('Failed to delete');
        }
        setActiveMenuId(null);
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

    const lastBuiltIso = useMemo(() => {
        const dates = resumes
            .map(r => r.updatedAt ?? r.date)
            .filter(Boolean) as string[];
        if (dates.length === 0) return null;
        dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        return dates[0];
    }, [resumes]);

    const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0]
        ?? user?.email?.split('@')[0]
        ?? 'there';

    const toolkitCount = tailoredResumes.length;

    return (
        <div className="min-h-screen bg-charcoal-50 flex flex-col">
            {/* Top nav */}
            <header className="bg-charcoal-50/90 backdrop-blur-md border-b border-charcoal-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Wordmark />
                    <div className="relative flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onEditProfile}
                            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors rounded-full"
                        >
                            <User size={16} />
                            My profile
                        </button>
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
                {/* Hero */}
                <section className="bg-paper border-b border-charcoal-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-16 pb-10 lg:pb-14">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                            <div className="max-w-2xl">
                                <SectionEyebrow>Your workspace</SectionEyebrow>
                                <h1 className="mt-3 font-display text-4xl sm:text-5xl font-semibold leading-[1.05] text-brand-700">
                                    Welcome back, <span className="italic text-accent-500">{firstName}</span>.
                                </h1>
                                <p className="mt-4 text-lg text-brand-500 leading-relaxed">
                                    Pick a role, build the full application toolkit, and when you're ready — practice with someone who actually does the hiring.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={onCreateNew}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-charcoal-50 bg-brand-700 rounded-full hover:bg-brand-800 transition-colors"
                                >
                                    <Plus size={16} />
                                    New application
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const el = document.getElementById('mock-interviews');
                                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-brand-700 bg-charcoal-50 border border-charcoal-300 rounded-full hover:border-brand-700 transition-colors"
                                >
                                    Browse consultants
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Stats strip */}
                        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-charcoal-200 border border-charcoal-200 rounded-2xl overflow-hidden">
                            <div className="bg-charcoal-50 p-5">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500 font-semibold">Toolkits built</p>
                                <p className="mt-2 font-display text-3xl font-semibold text-brand-700">{toolkitCount}</p>
                                <p className="text-xs text-charcoal-500 mt-1">Role-tailored application packages</p>
                            </div>
                            <div className="bg-charcoal-50 p-5">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500 font-semibold">Master resume</p>
                                <p className="mt-2 font-display text-lg font-semibold text-brand-700">
                                    {generalResume ? 'Ready' : 'Not yet built'}
                                </p>
                                <p className="text-xs text-charcoal-500 mt-1 flex items-center gap-1.5">
                                    {generalResume ? (
                                        <>
                                            <CheckCircle2 size={13} className="text-accent-500" />
                                            Profile-based general resume
                                        </>
                                    ) : (
                                        <>From your master profile</>
                                    )}
                                </p>
                            </div>
                            <div className="bg-charcoal-50 p-5">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500 font-semibold">Last built</p>
                                <p className="mt-2 font-display text-lg font-semibold text-brand-700">
                                    {lastBuiltIso ? formatRelative(lastBuiltIso) : '—'}
                                </p>
                                <p className="text-xs text-charcoal-500 mt-1 flex items-center gap-1.5">
                                    <Clock size={13} />
                                    {lastBuiltIso ? new Date(lastBuiltIso).toLocaleDateString() : 'No toolkits yet'}
                                </p>
                            </div>
                            <div className="bg-charcoal-50 p-5">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500 font-semibold">Mock interviews</p>
                                <p className="mt-2 font-display text-lg font-semibold text-brand-700">Coming soon</p>
                                <p className="text-xs text-charcoal-500 mt-1 flex items-center gap-1.5">
                                    <Lock size={13} />
                                    Practice with senior practitioners
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Your toolkits */}
                <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
                        <div>
                            <SectionEyebrow>Your toolkits</SectionEyebrow>
                            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-brand-700 leading-[1.05]">
                                Every role you've tailored for.
                            </h2>
                            <p className="mt-3 text-brand-500 leading-relaxed max-w-xl">
                                Each toolkit bundles a tailored resume, cover letter, outreach email, LinkedIn note, and interview prep. Open one to review or export.
                            </p>
                        </div>

                        <div className="relative md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by role or company"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-charcoal-200 rounded-full text-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500 transition-colors outline-none"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-brand-600" size={32} />
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* General (master) resume */}
                            {generalResume && (
                                <div>
                                    <p className="text-sm font-semibold text-brand-700 mb-3">Master resume</p>
                                    <button
                                        type="button"
                                        onClick={() => onOpenResume && onOpenResume(generalResume.id)}
                                        className="group w-full text-left bg-brand-700 text-charcoal-50 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5 hover:bg-brand-800 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-accent-400 text-brand-800 flex items-center justify-center shrink-0">
                                            <Sparkles size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] uppercase tracking-[0.22em] text-accent-300 font-semibold">General Resume</p>
                                            <h3 className="font-display text-xl font-semibold text-charcoal-50 mt-1">
                                                Your evergreen, role-agnostic resume
                                            </h3>
                                            <p className="text-sm text-charcoal-300 mt-1">
                                                Generated from your master profile. Regenerate every 24 hours.
                                            </p>
                                        </div>
                                        <div className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-accent-400 group-hover:text-accent-300">
                                            Open
                                            <ArrowRight size={16} />
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* Tailored toolkits */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-brand-700">Tailored toolkits</p>
                                    <p className="text-xs text-charcoal-500">
                                        {filteredTailored.length} of {tailoredResumes.length}
                                    </p>
                                </div>

                                {tailoredResumes.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-dashed border-charcoal-300 px-6 py-14 text-center">
                                        <div className="w-14 h-14 mx-auto rounded-full bg-accent-50 border border-accent-100 flex items-center justify-center mb-5">
                                            <FileText className="text-accent-600" size={24} />
                                        </div>
                                        <h3 className="font-display text-xl font-semibold text-brand-700 mb-2">
                                            No tailored toolkits yet
                                        </h3>
                                        <p className="text-brand-500 max-w-md mx-auto mb-6">
                                            Paste a job description and get a resume, cover letter, outreach email, LinkedIn note, and interview prep — all tailored to the role.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={onCreateNew}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-700 text-charcoal-50 rounded-full text-sm font-semibold hover:bg-brand-800 transition-colors"
                                        >
                                            <Plus size={16} />
                                            Build my first toolkit
                                        </button>
                                    </div>
                                ) : filteredTailored.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-charcoal-200 px-6 py-12 text-center">
                                        <p className="text-sm text-brand-500">
                                            No toolkits match "{searchTerm}".
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {filteredTailored.map(resume => {
                                            const displayTitle = resume.title.replace(/ Resume$/i, '').replace(/Resume$/i, '').trim() || 'Untitled';
                                            return (
                                                <div
                                                    key={resume.id}
                                                    className="relative bg-white rounded-2xl border border-charcoal-200 p-6 hover:border-brand-700 hover:shadow-lg transition-all cursor-pointer group"
                                                    onClick={() => onOpenResume && onOpenResume(resume.id)}
                                                >
                                                    <div className="flex justify-between items-start mb-5">
                                                        <div className="w-11 h-11 rounded-xl bg-brand-700 text-charcoal-50 flex items-center justify-center group-hover:bg-accent-400 group-hover:text-brand-800 transition-colors">
                                                            <FileText size={20} />
                                                        </div>

                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                aria-label="Toolkit actions"
                                                                className="text-charcoal-400 hover:text-brand-700 p-1.5 rounded-full hover:bg-charcoal-50 transition-colors"
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
                                                                        Delete toolkit
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <h3 className="font-display text-lg font-semibold text-brand-700 leading-snug line-clamp-2">
                                                        {displayTitle}
                                                    </h3>
                                                    {resume.company && (
                                                        <p className="text-sm text-charcoal-500 mt-1 line-clamp-1">{resume.company}</p>
                                                    )}

                                                    {/* Toolkit artifact chips */}
                                                    <div className="flex flex-wrap gap-1.5 mt-5">
                                                        {[
                                                            { icon: FileText, label: 'Resume' },
                                                            { icon: Mail, label: 'Cover letter' },
                                                            { icon: Target, label: 'Outreach' },
                                                            { icon: Linkedin, label: 'LinkedIn' },
                                                            { icon: MessageSquare, label: 'Q prep' },
                                                        ].map(({ icon: Icon, label }) => (
                                                            <span
                                                                key={label}
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-charcoal-50 border border-charcoal-100 text-[11px] font-medium text-brand-600"
                                                            >
                                                                <Icon size={11} />
                                                                {label}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="mt-5 pt-4 border-t border-charcoal-100 flex items-center justify-between text-xs text-charcoal-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={13} />
                                                            <span>{new Date(resume.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <span className="inline-flex items-center gap-1 text-brand-600 font-semibold group-hover:text-accent-600 transition-colors">
                                                            Open
                                                            <ArrowRight size={13} />
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* Consultant marketplace (placeholder) */}
                <section id="mock-interviews" className="bg-brand-700 text-charcoal-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
                        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
                            <div className="lg:col-span-5">
                                <p className="text-[11px] uppercase tracking-[0.22em] text-accent-400 font-semibold">
                                    Mock interviews · Coming soon
                                </p>
                                <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold leading-[1.05] text-charcoal-50">
                                    Practice with the people who actually do the hiring.
                                </h2>
                                <p className="mt-4 text-charcoal-300 leading-relaxed">
                                    1:1 mock interviews with verified senior practitioners — engineering managers, directors of product, and design leads — who run loops at top companies. Launching soon.
                                </p>

                                <ul className="mt-6 space-y-3">
                                    {[
                                        'Verified senior interviewers, role-specific',
                                        'Realistic full-loop simulation',
                                        'Written feedback within 24 hours',
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-3 text-sm text-charcoal-200">
                                            <CheckCircle2 size={16} className="text-accent-400 mt-0.5 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    type="button"
                                    disabled
                                    className="mt-8 inline-flex items-center gap-2 bg-brand-600 text-charcoal-300 font-semibold px-5 py-3 rounded-full cursor-not-allowed border border-brand-500"
                                    title="Mock interview booking is coming soon"
                                >
                                    <Lock size={15} />
                                    Notify me when it launches
                                </button>
                            </div>

                            <div className="lg:col-span-7">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {consultantPlaceholders.map((c, i) => (
                                        <div
                                            key={c.name}
                                            className={`relative bg-brand-800 border border-brand-600 rounded-2xl p-6 flex flex-col ${i === 1 ? 'sm:translate-y-6' : ''}`}
                                        >
                                            {/* Coming soon ribbon */}
                                            <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-accent-300 bg-brand-700 border border-brand-600 rounded-full px-2.5 py-1">
                                                <Lock size={11} />
                                                Soon
                                            </span>

                                            <div className="flex items-start gap-4 mb-4 pr-20">
                                                <div className="w-12 h-12 rounded-full bg-brand-600 text-charcoal-50 font-semibold flex items-center justify-center shrink-0">
                                                    {c.initials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-display text-base font-semibold text-charcoal-50 truncate">{c.name}</p>
                                                    <p className="text-xs text-charcoal-400 mt-0.5 truncate">{c.signal}</p>
                                                </div>
                                            </div>

                                            <p className="text-sm text-charcoal-200 mb-5">{c.focus}</p>

                                            <div className="flex items-center justify-between text-xs mt-auto pt-4 border-t border-brand-600">
                                                <div className="flex items-center gap-1 text-accent-400 font-semibold">
                                                    <Star size={13} className="fill-current" />
                                                    {c.rating}
                                                    <span className="text-charcoal-400 font-normal ml-1">({c.sessions})</span>
                                                </div>
                                                <p className="text-charcoal-300 font-medium">{c.rate}</p>
                                            </div>

                                            <button
                                                type="button"
                                                disabled
                                                className="mt-4 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold bg-brand-700 text-charcoal-400 border border-brand-600 rounded-full px-4 py-2.5 cursor-not-allowed"
                                                title="Booking opens soon"
                                            >
                                                <Lock size={13} />
                                                Book consultation
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Legacy applications list (kept for compatibility) */}
                {applications.length > 0 && (
                    <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                        <SectionEyebrow>Job applications</SectionEyebrow>
                        <h2 className="mt-2 font-display text-2xl font-semibold text-brand-700 mb-6">
                            Tracked applications
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {applications.map(app => (
                                <button
                                    type="button"
                                    key={app.id}
                                    onClick={() => onOpenApplication(app.id)}
                                    className="text-left bg-white rounded-2xl border border-charcoal-200 p-6 hover:border-brand-700 hover:shadow-md transition-all"
                                >
                                    <h3 className="font-display text-lg font-semibold text-brand-700 line-clamp-1">{app.jobTitle}</h3>
                                    <p className="text-sm text-charcoal-500 mt-1 line-clamp-1">{app.companyName}</p>
                                    <div className="mt-5 pt-4 border-t border-charcoal-100 flex items-center justify-between text-xs text-charcoal-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={13} />
                                            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <span className="bg-accent-50 text-accent-700 px-2 py-0.5 rounded-full font-medium border border-accent-100">Active</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <footer className="border-t border-charcoal-200 bg-charcoal-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-brand-500">
                    <Wordmark />
                    <p>&copy; {new Date().getFullYear()} TOP CANDIDATE · The complete toolkit to land the job.</p>
                </div>
            </footer>
        </div>
    );
};
