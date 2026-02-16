import React from 'react';
import { ArrowRight, CheckCircle2, Star, Shield, Zap } from 'lucide-react';

interface Props {
    onGetStarted: () => void;
}

export const LandingScreen = ({ onGetStarted }: Props) => {
    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">Roh ATS <span className="text-indigo-600">Builder</span></span>
                    </div>
                    <button
                        onClick={onGetStarted}
                        className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-16 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12">

                    {/* Text Content */}
                    <div className="flex-1 text-center lg:text-left z-10">

                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                            Build your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Dream Career</span> with AI.
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            Stop guessing keywords. Create perfectly tailored resumes for every job application in seconds using our advanced AI engine.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button
                                onClick={onGetStarted}
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-1 ring-offset-2 focus:ring-2 ring-indigo-600"
                            >
                                Get Started Free
                                <ArrowRight className="ml-2" />
                            </button>
                            <button
                                onClick={() => {
                                    const features = document.getElementById('features');
                                    features?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-gray-700 transition-all bg-gray-100 rounded-xl hover:bg-gray-200"
                            >
                                View Features
                            </button>
                        </div>

                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-8 text-gray-400 text-sm font-medium">
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Free to try</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> No credit card</div>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                        <div className="absolute top-0 -right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
                        <div className="absolute -bottom-8 -left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
                        <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white p-2">
                            <img
                                src="/landing_hero_illustration.png"
                                alt="Resume Builder Dashboard"
                                className="w-full h-auto rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div id="features" className="bg-gray-50 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Optimization</h3>
                            <p className="text-gray-600">We analyze job descriptions and optimize your bullets to match required keywords instantly.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Master Profile</h3>
                            <p className="text-gray-600">Store your experience once. Generate infinite tailored resumes without re-typing.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                                <Star size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">ATS Friendly</h3>
                            <p className="text-gray-600">Our templates are designed to pass through Applicant Tracking Systems with 100% parse rate.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
