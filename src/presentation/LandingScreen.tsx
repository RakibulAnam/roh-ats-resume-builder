import React, { useState } from 'react';
import {
    ArrowRight,
    ArrowUpRight,
    CheckCircle2,
    FileText,
    Mail,
    Linkedin,
    MessageSquare,
    Users,
    Target,
    Sparkles,
    Star,
    Quote,
    Play,
    Menu,
    X,
} from 'lucide-react';

interface Props {
    onGetStarted: () => void;
}

/**
 * Image placeholder that falls back to a styled card if the asset isn't on disk yet.
 * Replace the asset by dropping the file into /public with the matching filename.
 */
const Asset = ({
    src,
    alt,
    filename,
    description,
    dimensions,
    className = '',
}: {
    src: string;
    alt: string;
    filename: string;
    description: string;
    dimensions: string;
    className?: string;
}) => {
    const [missing, setMissing] = useState(false);
    if (!missing) {
        return (
            <img
                src={src}
                alt={alt}
                className={className}
                onError={() => setMissing(true)}
            />
        );
    }
    return (
        <div
            className={`${className} bg-charcoal-100 border border-dashed border-charcoal-300 flex items-center justify-center text-center p-6`}
            role="img"
            aria-label={alt}
        >
            <div className="max-w-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal-500 mb-2">Asset placeholder</p>
                <p className="font-display text-lg font-semibold text-brand-700 mb-2">{alt}</p>
                <p className="text-sm text-charcoal-600 mb-3 leading-relaxed">{description}</p>
                <p className="text-xs font-mono text-charcoal-500">/public/{filename}</p>
                <p className="text-[11px] text-charcoal-400 mt-1">{dimensions}</p>
            </div>
        </div>
    );
};

const Wordmark = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
    const wordSize = size === 'sm' ? 'text-base' : 'text-lg';
    return (
        <div className="flex items-baseline gap-1.5 select-none">
            <span className={`font-display font-semibold tracking-tight text-brand-700 ${wordSize}`}>TOP</span>
            <span className={`font-display font-semibold tracking-tight text-accent-500 ${wordSize}`}>CANDIDATE</span>
        </div>
    );
};

const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] uppercase tracking-[0.22em] text-accent-600 font-semibold mb-4">
        {children}
    </p>
);

const features = [
    {
        icon: FileText,
        title: 'ATS-friendly resume',
        description:
            'Paste a job description. Get a tailored, keyword-aligned resume that survives the parser and reads like it was written by a senior recruiter.',
    },
    {
        icon: Mail,
        title: 'Cover letter that gets read',
        description:
            'A short, specific letter that ties your story to the role — no clichés, no recycled paragraphs, no "to whom it may concern".',
    },
    {
        icon: ArrowUpRight,
        title: 'Hiring manager outreach',
        description:
            'A warm, well-researched outreach email you can send directly to the person doing the hiring — without sounding like a template.',
    },
    {
        icon: Linkedin,
        title: 'LinkedIn connection note',
        description:
            'A 280-character intro that earns the accept. Tailored to the role, the company, and what the recipient actually cares about.',
    },
    {
        icon: MessageSquare,
        title: 'Must-know interview questions',
        description:
            'The 5–10 questions you will almost certainly be asked for this role, with notes on what great answers signal to the interviewer.',
    },
    {
        icon: Users,
        title: 'Mock interviews with hiring managers',
        description:
            'Book a 1:1 mock with a senior practitioner who runs interviews for this exact kind of role. Real signal, written feedback.',
    },
];

const steps = [
    {
        n: '01',
        title: 'Build your master profile',
        body: 'One time. Drop in your work, projects, education, skills. Everything else is generated from this source of truth.',
    },
    {
        n: '02',
        title: 'Paste the job description',
        body: 'Any role you are targeting. Copy the JD, drop it in, name the company.',
    },
    {
        n: '03',
        title: 'Generate your full toolkit',
        body: 'Resume, cover letter, outreach email, LinkedIn note, and your interview question shortlist — all in seconds.',
    },
    {
        n: '04',
        title: 'Practice with someone who hires',
        body: 'Book a mock interview with a verified senior practitioner. Walk in confident, walk out hired.',
    },
];

const consultants = [
    {
        name: 'Engineering Manager',
        focus: 'Senior + Staff Software Engineer mocks',
        company: 'Hiring at series-B startups',
        rate: '$120 / 60 min',
        rating: 4.9,
        sessions: 142,
    },
    {
        name: 'Director of Product',
        focus: 'Group PM and PM mocks',
        company: 'Reviewer at FAANG and growth-stage cos',
        rate: '$160 / 60 min',
        rating: 5.0,
        sessions: 88,
    },
    {
        name: 'Head of Design',
        focus: 'Senior Product Designer mocks',
        company: 'Hires designers at consumer scale-ups',
        rate: '$140 / 60 min',
        rating: 4.8,
        sessions: 67,
    },
];

const testimonials = [
    {
        quote:
            'I had been applying for four months with two interviews. After two weeks of using TOP CANDIDATE I had five and signed an offer at the third.',
        author: 'Priya K.',
        role: 'Senior Software Engineer',
        initials: 'PK',
    },
    {
        quote:
            'The outreach email feature is the part nobody talks about. I got three replies from hiring managers in the first week.',
        author: 'Marcus T.',
        role: 'Product Manager',
        initials: 'MT',
    },
    {
        quote:
            'My mock interviewer was a Director who runs the loop at the company I was targeting. She told me exactly what they look for.',
        author: 'Lena R.',
        role: 'Product Designer',
        initials: 'LR',
    },
];

export const LandingScreen = ({ onGetStarted }: Props) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMobileOpen(false);
    };

    return (
        <div className="min-h-screen bg-charcoal-50 text-brand-700">
            {/* Announcement bar */}
            <div className="bg-brand-700 text-charcoal-100 text-xs sm:text-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2 text-center">
                    <Sparkles size={14} className="text-accent-400 shrink-0" />
                    <span>
                        New: book mock interviews with the people who do the hiring.{' '}
                        <button
                            type="button"
                            onClick={() => scrollTo('mock-interviews')}
                            className="underline underline-offset-2 decoration-accent-400 hover:text-accent-300 transition-colors font-medium"
                        >
                            See how it works
                        </button>
                    </span>
                </div>
            </div>

            {/* Navbar */}
            <nav className="border-b border-charcoal-200 bg-charcoal-50/85 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button type="button" onClick={() => scrollTo('top')} className="flex items-center">
                        <Wordmark />
                    </button>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-500">
                        <button type="button" onClick={() => scrollTo('toolkit')} className="hover:text-brand-700 transition-colors">Toolkit</button>
                        <button type="button" onClick={() => scrollTo('mock-interviews')} className="hover:text-brand-700 transition-colors">Mock interviews</button>
                        <button type="button" onClick={() => scrollTo('how')} className="hover:text-brand-700 transition-colors">How it works</button>
                        <button type="button" onClick={() => scrollTo('proof')} className="hover:text-brand-700 transition-colors">Stories</button>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onGetStarted}
                            className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors px-3 py-2"
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            onClick={onGetStarted}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-brand-700 text-charcoal-50 px-4 py-2 rounded-full hover:bg-brand-800 transition-colors"
                        >
                            Get started
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    <button
                        type="button"
                        className="md:hidden p-2 -mr-2 text-brand-600"
                        onClick={() => setMobileOpen((s) => !s)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {mobileOpen && (
                    <div className="md:hidden border-t border-charcoal-200 bg-charcoal-50">
                        <div className="px-4 py-4 flex flex-col gap-1 text-sm font-medium text-brand-600">
                            <button type="button" onClick={() => scrollTo('toolkit')} className="text-left py-2.5">Toolkit</button>
                            <button type="button" onClick={() => scrollTo('mock-interviews')} className="text-left py-2.5">Mock interviews</button>
                            <button type="button" onClick={() => scrollTo('how')} className="text-left py-2.5">How it works</button>
                            <button type="button" onClick={() => scrollTo('proof')} className="text-left py-2.5">Stories</button>
                            <div className="h-px bg-charcoal-200 my-2" />
                            <button type="button" onClick={onGetStarted} className="text-left py-2.5">Sign in</button>
                            <button
                                type="button"
                                onClick={onGetStarted}
                                className="mt-2 inline-flex items-center justify-center gap-1.5 bg-brand-700 text-charcoal-50 px-4 py-3 rounded-full font-semibold"
                            >
                                Get started <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero */}
            <section id="top" className="bg-paper">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-28 pb-20 lg:pb-28">
                    <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                        <div className="lg:col-span-7">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-50 text-accent-700 text-xs font-semibold border border-accent-100 mb-6">
                                <Sparkles size={12} />
                                The complete job-search toolkit
                            </div>

                            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.02] text-brand-700 mb-6">
                                Become the{' '}
                                <span className="italic text-accent-500">top candidate</span>{' '}
                                for the job.
                            </h1>

                            <p className="text-lg sm:text-xl text-brand-500 leading-relaxed max-w-2xl mb-8">
                                Stop sending generic applications. Get a complete toolkit for every role you target — a tailored resume, cover letter, hiring-manager outreach, interview prep, and 1:1 mock interviews with people who actually do the hiring.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                                <button
                                    type="button"
                                    onClick={onGetStarted}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-charcoal-50 bg-brand-700 rounded-full hover:bg-brand-800 transition-colors"
                                >
                                    Build my toolkit — free
                                    <ArrowRight size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollTo('how')}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-brand-700 bg-charcoal-50 border border-charcoal-300 rounded-full hover:border-brand-700 transition-colors"
                                >
                                    <Play size={16} className="fill-current" />
                                    See how it works
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-500">
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-accent-500" /> Free to try</div>
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-accent-500" /> No credit card</div>
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-accent-500" /> Export to PDF & Word</div>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-brand-700 rounded-[2rem] -rotate-2 hidden sm:block" aria-hidden />
                                <div className="relative bg-charcoal-50 rounded-3xl border border-charcoal-300 shadow-2xl shadow-brand-900/10 overflow-hidden">
                                    <Asset
                                        src="/hero_dashboard_mockup.png"
                                        alt="TOP CANDIDATE dashboard"
                                        filename="hero_dashboard_mockup.png"
                                        description="Screenshot or designed mockup of the app dashboard showing a tailored resume, the cover letter, and the outreach email side-by-side. Use a real example role like 'Senior Product Designer at Linear'. Cream background, ink text, saffron accents on CTAs."
                                        dimensions="1600 × 1100, PNG with transparent or cream background"
                                        className="w-full h-auto aspect-[16/11] object-cover"
                                    />
                                </div>

                                <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-charcoal-50 border border-charcoal-300 rounded-2xl px-4 py-3 shadow-xl shadow-brand-900/10 items-center gap-3 max-w-[260px]">
                                    <div className="w-9 h-9 rounded-full bg-accent-50 border border-accent-200 flex items-center justify-center text-accent-600 shrink-0">
                                        <Target size={16} />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-semibold text-brand-700">Tailored in 38 seconds</p>
                                        <p className="text-brand-500">Resume + cover letter + outreach</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The toolkit */}
            <section id="toolkit" className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mb-14">
                        <SectionEyebrow>The toolkit</SectionEyebrow>
                        <h2 className="font-display text-4xl sm:text-5xl font-semibold text-brand-700 leading-[1.05] mb-5">
                            Everything you need to land the offer — in one place.
                        </h2>
                        <p className="text-lg text-brand-500 leading-relaxed">
                            Most candidates ship a resume and hope. Top candidates ship a complete, role-specific package and follow it up with a real conversation. Here is what the platform generates for every job you target.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-charcoal-200 border border-charcoal-200 rounded-3xl overflow-hidden">
                        {features.map(({ icon: Icon, title, description }) => (
                            <div key={title} className="bg-charcoal-50 p-7 lg:p-8 hover:bg-charcoal-100 transition-colors">
                                <div className="w-11 h-11 rounded-xl bg-brand-700 text-charcoal-50 flex items-center justify-center mb-5">
                                    <Icon size={20} />
                                </div>
                                <h3 className="font-display text-xl font-semibold text-brand-700 mb-2.5">{title}</h3>
                                <p className="text-sm text-brand-500 leading-relaxed">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mock interviews spotlight */}
            <section id="mock-interviews" className="bg-brand-700 text-charcoal-100 py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                        <div className="lg:col-span-5">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-accent-400 font-semibold mb-4">
                                Mock interviews
                            </p>
                            <h2 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.05] text-charcoal-50 mb-5">
                                Practice with the people who actually do the hiring.
                            </h2>
                            <p className="text-lg text-charcoal-300 leading-relaxed mb-8">
                                Book a 1:1 mock interview with a verified senior practitioner — engineering managers, directors of product, design leads — who run interviews at top companies for the exact role you are targeting.
                            </p>

                            <ul className="space-y-3.5 mb-9">
                                {[
                                    'Verified senior interviewers, role-specific',
                                    'Realistic, full-loop simulation',
                                    'Written feedback within 24 hours',
                                    'Optional recording to review your answers',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-charcoal-200">
                                        <CheckCircle2 size={18} className="text-accent-400 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                type="button"
                                onClick={onGetStarted}
                                className="inline-flex items-center gap-2 bg-accent-400 text-brand-800 font-semibold px-6 py-3.5 rounded-full hover:bg-accent-300 transition-colors"
                            >
                                Browse consultants
                                <ArrowRight size={18} />
                            </button>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="grid sm:grid-cols-2 gap-4">
                                {consultants.map((c, i) => (
                                    <div
                                        key={c.name}
                                        className={`bg-brand-800 border border-brand-600 rounded-2xl p-6 flex flex-col ${i === 0 ? 'sm:translate-y-6' : ''} ${i === 2 ? 'sm:translate-y-6 sm:col-span-2 sm:max-w-[calc(50%-0.5rem)] sm:mx-auto' : ''}`}
                                    >
                                        <div className="flex items-start gap-4 mb-4">
                                            <Asset
                                                src={`/avatar_consultant_${i + 1}.png`}
                                                alt={`Photo of ${c.name}`}
                                                filename={`avatar_consultant_${i + 1}.png`}
                                                description={`Professional headshot, neutral background, friendly. Replace with a real (or stock) photo of a senior practitioner who fits "${c.name}".`}
                                                dimensions="200 × 200, PNG, square"
                                                className="w-14 h-14 rounded-full object-cover bg-brand-600 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-display text-base font-semibold text-charcoal-50">{c.name}</p>
                                                <p className="text-xs text-charcoal-400 mt-0.5">{c.company}</p>
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how" className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mb-14">
                        <SectionEyebrow>How it works</SectionEyebrow>
                        <h2 className="font-display text-4xl sm:text-5xl font-semibold text-brand-700 leading-[1.05]">
                            Four steps from job description to offer.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-charcoal-200 border border-charcoal-200 rounded-3xl overflow-hidden">
                        {steps.map((step) => (
                            <div key={step.n} className="bg-charcoal-50 p-7 lg:p-8">
                                <p className="font-display text-5xl font-semibold text-accent-500 mb-5">{step.n}</p>
                                <h3 className="font-display text-xl font-semibold text-brand-700 mb-3">{step.title}</h3>
                                <p className="text-sm text-brand-500 leading-relaxed">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why TOP CANDIDATE */}
            <section className="bg-charcoal-100 py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 lg:gap-16">
                    <div className="lg:col-span-5">
                        <SectionEyebrow>Why TOP CANDIDATE</SectionEyebrow>
                        <h2 className="font-display text-4xl sm:text-5xl font-semibold text-brand-700 leading-[1.05] mb-5">
                            Built for outcomes, not vanity metrics.
                        </h2>
                        <p className="text-lg text-brand-500 leading-relaxed">
                            Other tools end at "your resume is ready". The job hunt does not. We give you the full stack, and access to the humans who decide.
                        </p>
                    </div>
                    <div className="lg:col-span-7 space-y-px bg-charcoal-200 border border-charcoal-200 rounded-3xl overflow-hidden">
                        {[
                            { title: 'The full job-search stack', body: 'Resume, cover letter, outreach, interview prep and live coaching — not five different products.' },
                            { title: 'Coaching from people who hire', body: 'Mock interviews are run by senior practitioners who actively review candidates for the same kind of role.' },
                            { title: 'Trained on what recruiters reject', body: 'The AI is tuned on real recruiter feedback, ATS quirks, and the specific failure modes of generic applications.' },
                        ].map((row) => (
                            <div key={row.title} className="bg-charcoal-50 p-7 lg:p-8 flex gap-5 items-start">
                                <div className="w-9 h-9 rounded-full bg-accent-50 border border-accent-200 flex items-center justify-center text-accent-600 shrink-0">
                                    <CheckCircle2 size={18} />
                                </div>
                                <div>
                                    <h3 className="font-display text-lg font-semibold text-brand-700 mb-1.5">{row.title}</h3>
                                    <p className="text-sm text-brand-500 leading-relaxed">{row.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="proof" className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mb-14">
                        <SectionEyebrow>Stories</SectionEyebrow>
                        <h2 className="font-display text-4xl sm:text-5xl font-semibold text-brand-700 leading-[1.05]">
                            Candidates who stopped guessing — and started landing.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t) => (
                            <figure key={t.author} className="bg-charcoal-50 border border-charcoal-200 rounded-2xl p-7 flex flex-col">
                                <Quote size={22} className="text-accent-500 mb-5" />
                                <blockquote className="font-display text-lg leading-snug text-brand-700 mb-7 flex-1">
                                    "{t.quote}"
                                </blockquote>
                                <figcaption className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-700 text-charcoal-50 font-semibold flex items-center justify-center text-sm">
                                        {t.initials}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-brand-700">{t.author}</p>
                                        <p className="text-xs text-brand-500">{t.role}</p>
                                    </div>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="px-4 sm:px-6 lg:px-8 pb-20 lg:pb-28">
                <div className="max-w-7xl mx-auto bg-brand-700 text-charcoal-50 rounded-[2rem] px-8 sm:px-14 py-16 lg:py-20 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-paper opacity-[0.04]" aria-hidden />
                    <div className="relative max-w-3xl mx-auto">
                        <SectionEyebrow>
                            <span className="text-accent-400">Ready when you are</span>
                        </SectionEyebrow>
                        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] mb-6">
                            Build your first tailored application in under a minute.
                        </h2>
                        <p className="text-lg text-charcoal-300 leading-relaxed mb-10 max-w-2xl mx-auto">
                            Free to try. No credit card. Bring a real job description and walk out with a resume, cover letter, outreach email and interview shortlist.
                        </p>
                        <button
                            type="button"
                            onClick={onGetStarted}
                            className="inline-flex items-center gap-2 bg-accent-400 text-brand-800 font-semibold px-8 py-4 rounded-full hover:bg-accent-300 transition-colors text-base"
                        >
                            Get started — it&apos;s free
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-charcoal-200 bg-charcoal-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <Wordmark />
                        <p className="text-xs text-brand-500 mt-2">The complete toolkit to land the job.</p>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-500">
                        <a href="#toolkit" className="hover:text-brand-700 transition-colors">Toolkit</a>
                        <a href="#mock-interviews" className="hover:text-brand-700 transition-colors">Mock interviews</a>
                        <a href="#how" className="hover:text-brand-700 transition-colors">How it works</a>
                        <a href="#proof" className="hover:text-brand-700 transition-colors">Stories</a>
                    </div>
                    <p className="text-xs text-brand-400">&copy; {new Date().getFullYear()} TOP CANDIDATE</p>
                </div>
            </footer>
        </div>
    );
};
