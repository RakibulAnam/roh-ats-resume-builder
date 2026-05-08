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
import { createResumeService, applicationRepository, profileRepository } from '../infrastructure/config/dependencies';
import { Application } from '../domain/repositories/IApplicationRepository';
import { ResumeService } from '../application/services/ResumeService';
import { toast } from 'sonner';
import { useT } from './i18n/LocaleContext';
import { LanguageToggle } from './i18n/LanguageToggle';
import { PurchaseModal } from './components/PurchaseModal';
import { CreditsBadge } from './components/CreditsBadge';

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

export const DashboardScreen = ({ onCreateNew, onEditProfile, onOpenApplication, onOpenResume }: Props) => {
    const { user, signOut } = useAuth();
    const t = useT();

    const formatRelative = (iso?: string | null): string | null => {
        if (!iso) return null;
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return null;
        const diffMs = Date.now() - d.getTime();
        const sec = Math.round(diffMs / 1000);
        if (sec < 60) return t('dashboard.relativeJustNow');
        const min = Math.round(sec / 60);
        if (min < 60) return t('dashboard.relativeMin', { n: min });
        const hr = Math.round(min / 60);
        if (hr < 24) return t('dashboard.relativeHr', { n: hr });
        const days = Math.round(hr / 24);
        if (days < 7) return t('dashboard.relativeDay', { n: days });
        return d.toLocaleDateString();
    };

    const [applications, setApplications] = useState<Application[]>([]);
    const [resumes, setResumes] = useState<ResumeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [buildingMaster, setBuildingMaster] = useState(false);
    // Toolkit credits — null while loading. Refreshed after each successful
    // purchase via the PurchaseModal's onSuccess callback.
    const [credits, setCredits] = useState<number | null>(null);
    const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

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
            const [apps, resumeList, creditBalance] = await Promise.all([
                applicationRepository.getApplications(user.id),
                resumeService.getGeneratedResumes(user.id),
                // Wrap so a credit-fetch failure doesn't kill the dashboard.
                profileRepository.getToolkitCredits(user.id).catch(err => {
                    console.warn('Could not load toolkit credits', err);
                    return null;
                }),
            ]);
            setApplications(apps);
            setResumes(resumeList);
            if (creditBalance !== null) setCredits(creditBalance);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(t('dashboard.confirmDelete'))) return;
        try {
            const resumeService = createResumeService();
            await resumeService.deleteGeneratedResume(id);
            setResumes(prev => prev.filter(r => r.id !== id));
            toast.success(t('dashboard.deleted'));
        } catch (error) {
            console.error('Failed to delete resume:', error);
            toast.error(t('dashboard.deleteFailed'));
        }
        setActiveMenuId(null);
    };

    const handleBuildMaster = async () => {
        if (!user || buildingMaster) return;
        setBuildingMaster(true);
        try {
            const resumeService = createResumeService();
            const id = await resumeService.generateGeneralResume(user.id);
            toast.success(t('dashboard.masterReady'));
            onOpenResume?.(id);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || t('dashboard.masterError'));
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
        ?? t('dashboard.greetingFallbackName');

    const masterUpdatedAt = generalResume?.updatedAt ?? generalResume?.date;

    return (
        <div className="min-h-screen bg-paper flex flex-col">
            {/* Top nav */}
            <header className="bg-paper/90 backdrop-blur-md border-b border-charcoal-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Wordmark />
                    <div className="relative flex items-center gap-2">
                        <CreditsBadge credits={credits} onBuy={() => setPurchaseModalOpen(true)} />
                        <LanguageToggle />
                        <button
                            type="button"
                            onClick={() => setProfileMenuOpen(v => !v)}
                            className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white border border-charcoal-200 hover:border-charcoal-300 transition-colors"
                            aria-label={t('dashboard.accountMenuLabel')}
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
                                        <p className="text-xs text-charcoal-500">{t('dashboard.signedInAs')}</p>
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
                                        <User size={16} /> {t('dashboard.myProfile')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileMenuOpen(false);
                                            signOut();
                                        }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={16} /> {t('dashboard.signOut')}
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
                            {t('dashboard.greetingPrefix')} <span className="italic text-accent-500">{firstName}</span>{t('dashboard.greetingSuffix')}
                        </h1>
                        <p className="mt-2 text-brand-500">
                            {t('dashboard.greetingHelp')}
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
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-[11px] uppercase tracking-[0.22em] text-accent-400 font-semibold">
                                    {t('dashboard.tailorEyebrow')}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800 bg-accent-400 rounded-full px-2.5 py-1">
                                    {credits === 0 ? t('dashboard.tailorCostNoteZero') : t('dashboard.tailorCostNote')}
                                </span>
                            </div>
                            <h2 className="mt-3 font-display text-2xl sm:text-[26px] font-semibold leading-snug text-charcoal-50">
                                {t('dashboard.tailorTitle')}
                            </h2>
                            <p className="mt-2 text-[15px] leading-relaxed text-charcoal-300">
                                {t('dashboard.tailorBody')}
                            </p>
                            <div className="mt-auto inline-flex items-center gap-2 self-start px-5 py-3 bg-accent-400 text-brand-800 rounded-full text-sm font-semibold group-hover:bg-accent-300 transition-colors">
                                <Plus size={16} />
                                {t('dashboard.tailorCta')}
                            </div>
                        </button>

                        {/* Card B — Master resume */}
                        {generalResume ? (
                            <button
                                type="button"
                                onClick={() => onOpenResume?.(generalResume.id)}
                                className="group text-left relative bg-white hover:border-brand-700 hover:shadow-md transition-all border border-charcoal-200 rounded-2xl p-7 sm:p-8 flex flex-col min-h-[260px]"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold">
                                            {t('dashboard.masterEyebrow')}
                                        </span>
                                        <span className="inline-flex items-center text-[11px] font-semibold text-brand-700 bg-charcoal-50 border border-charcoal-200 rounded-full px-2 py-0.5">
                                            {t('dashboard.masterCostNote')}
                                        </span>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-600 bg-charcoal-50 border border-charcoal-200 rounded-full px-2.5 py-1">
                                        <CheckCircle2 size={12} className="text-accent-500" />
                                        {t('dashboard.masterReadyBadge')}
                                    </span>
                                </div>
                                <h2 className="mt-3 font-display text-2xl sm:text-[26px] font-semibold leading-snug text-brand-700">
                                    {t('dashboard.masterReadyTitle')}
                                </h2>
                                <p className="mt-2 text-[15px] leading-relaxed text-brand-500">
                                    {t('dashboard.masterReadyBody')}
                                </p>
                                <div className="mt-auto pt-6 flex items-center justify-between">
                                    <span className="text-xs text-charcoal-500">
                                        {masterUpdatedAt
                                            ? t('dashboard.masterUpdated', { when: formatRelative(masterUpdatedAt) ?? '' })
                                            : t('dashboard.masterUpToDate')}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 group-hover:text-accent-600 transition-colors">
                                        {t('dashboard.masterOpenCta')}
                                        <ArrowRight size={16} />
                                    </span>
                                </div>
                            </button>
                        ) : (
                            <div className="relative bg-white border border-dashed border-charcoal-300 rounded-2xl p-7 sm:p-8 flex flex-col min-h-[260px]">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold">
                                        {t('dashboard.masterEyebrow')}
                                    </span>
                                    <span className="inline-flex items-center text-[11px] font-semibold text-brand-700 bg-charcoal-50 border border-charcoal-200 rounded-full px-2 py-0.5">
                                        {t('dashboard.masterCostNote')}
                                    </span>
                                </div>
                                <h2 className="mt-3 font-display text-2xl sm:text-[26px] font-semibold leading-snug text-brand-700">
                                    {t('dashboard.masterEmptyTitle')}
                                </h2>
                                <p className="mt-2 text-[15px] leading-relaxed text-brand-500">
                                    {t('dashboard.masterEmptyBody')}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleBuildMaster}
                                    disabled={buildingMaster}
                                    className="mt-auto inline-flex items-center gap-2 self-start px-5 py-3 bg-brand-700 text-charcoal-50 rounded-full text-sm font-semibold hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {buildingMaster ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            {t('dashboard.masterBuilding')}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            {t('dashboard.masterBuildCta')}
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
                                    {t('dashboard.appsTitle')}
                                </h2>
                                <p className="text-sm text-brand-500 mt-1">
                                    {tailoredResumes.length === 0
                                        ? t('dashboard.appsEmpty')
                                        : tailoredResumes.length === 1
                                            ? t('dashboard.appsCountOne', { count: tailoredResumes.length })
                                            : t('dashboard.appsCountMany', { count: tailoredResumes.length })}
                                </p>
                            </div>

                            {tailoredResumes.length > 0 && (
                                <div className="relative sm:w-72">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder={t('dashboard.appsSearchPlaceholder')}
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
                                    {t('dashboard.appsEmptyStateTitle')}
                                </h3>
                                <p className="text-sm text-brand-500 max-w-md mx-auto">
                                    {t('dashboard.appsEmptyStateBefore')}
                                    <span className="font-semibold text-brand-700">{t('dashboard.appsEmptyStateCta')}</span>
                                    {t('dashboard.appsEmptyStateAfter')}
                                </p>
                            </div>
                        ) : filteredTailored.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-charcoal-200 px-6 py-10 text-center">
                                <p className="text-sm text-brand-500">
                                    {t('dashboard.appsNoMatch', { query: searchTerm })}
                                </p>
                            </div>
                        ) : (
                            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTailored.map(resume => {
                                    const displayTitle = resume.title.replace(/ Resume$/i, '').replace(/Resume$/i, '').trim() || t('dashboard.untitledRole');
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
                                                        aria-label={t('dashboard.appActionsLabel')}
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
                                                                {t('dashboard.delete')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-5 pt-4 border-t border-charcoal-100 flex items-center justify-between text-xs">
                                                <span className="text-charcoal-500">
                                                    {t('dashboard.builtOn', { when: formatRelative(resume.updatedAt ?? resume.date) ?? '' })}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-brand-600 font-semibold group-hover:text-accent-600 transition-colors">
                                                    {t('dashboard.open')}
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
                                    {t('dashboard.mockTeaserEyebrow')}
                                </p>
                                <p className="text-sm text-brand-700 font-medium mt-0.5">
                                    {t('dashboard.mockTeaserBody')}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled
                            className="text-sm font-semibold text-charcoal-500 bg-charcoal-50 border border-charcoal-200 rounded-full px-4 py-2 cursor-not-allowed shrink-0"
                            title={t('dashboard.mockTeaserTooltip')}
                        >
                            {t('dashboard.mockTeaserCta')}
                        </button>
                    </aside>

                    {/* Legacy applications (only shown if real legacy data exists) */}
                    {applications.length > 0 && (
                        <section className="mt-12">
                            <h2 className="font-display text-lg font-semibold text-brand-700 mb-4">
                                {t('dashboard.legacyTitle')}
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
                    <p>{t('dashboard.footerLine', { year: new Date().getFullYear() })}</p>
                </div>
            </footer>

            <PurchaseModal
                isOpen={purchaseModalOpen}
                onClose={() => setPurchaseModalOpen(false)}
                onSuccess={(newBalance) => setCredits(newBalance)}
            />
        </div>
    );
};
