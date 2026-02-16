import React, { useEffect, useState } from 'react';
import { Plus, FileText, User, MoreVertical, Calendar, Briefcase, Search, Loader2, Trash } from 'lucide-react';
import { useAuth } from '../infrastructure/auth/AuthContext';
import { createResumeService, applicationRepository } from '../infrastructure/config/dependencies';
import { Application } from '../domain/repositories/IApplicationRepository';
import { toast } from 'sonner';

interface Props {
    onCreateNew: () => void;
    onEditProfile: () => void;
    onOpenApplication: (io: string) => void;
    onOpenResume?: (id: string, data?: any) => void; // Optional for now
}

export const DashboardScreen = ({ onCreateNew, onEditProfile, onOpenApplication, onOpenResume }: Props) => {
    const { user, signOut } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [resumes, setResumes] = useState<{ id: string; title: string; date: string; company?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            if (!user) return;
            const resumeService = createResumeService();
            const [apps, resumeList] = await Promise.all([
                applicationRepository.getApplications(user.id),
                resumeService.getGeneratedResumes(user.id)
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
        if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) return;

        try {
            const resumeService = createResumeService();
            await resumeService.deleteGeneratedResume(id);
            setResumes(prev => prev.filter(r => r.id !== id));
            toast.success('Resume deleted successfully');
        } catch (error) {
            console.error('Failed to delete resume:', error);
            toast.error('Failed to delete resume');
        }
        setActiveMenuId(null);
    };

    const filteredApps = applications.filter(app =>
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">Roh ATS <span className="text-indigo-600">Builder</span></span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={onEditProfile} className="text-sm font-medium text-gray-600 hover:text-indigo-600 flex items-center gap-2">
                            <User size={18} />
                            <span className="hidden sm:inline">My Profile</span>
                        </button>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <button onClick={signOut} className="text-sm font-medium text-gray-500 hover:text-red-600">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main
                className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
                onClick={() => setActiveMenuId(null)}
            >

                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-500">Welcome back! manage your job applications.</p>
                    </div>

                    <button
                        onClick={onCreateNew}
                        className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm gap-2"
                    >
                        <Plus size={20} />
                        New Application
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : filteredApps.length === 0 && resumes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No resumes yet</h3>
                        <p className="text-gray-500 mb-6">Create your first AI-tailored resume to get started.</p>
                        <button
                            onClick={onCreateNew}
                            className="text-indigo-600 font-medium hover:text-indigo-700"
                        >
                            Create New Resume
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {resumes.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 mb-4">My Resumes</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {resumes.map(resume => (
                                        <div
                                            key={resume.id}
                                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer group relative"
                                            onClick={() => onOpenResume && onOpenResume(resume.id)}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="relative">
                                                    <button
                                                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === resume.id ? null : resume.id);
                                                        }}
                                                    >
                                                        <MoreVertical size={18} />
                                                    </button>

                                                    {activeMenuId === resume.id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100 ring-1 ring-black ring-opacity-5">
                                                            <button
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                onClick={(e) => handleDeleteResume(resume.id, e)}
                                                            >
                                                                <Trash size={16} className="mr-2" />
                                                                Delete Resume
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                                                {resume.title.replace(/ Resume$/i, '').replace(/Resume$/i, '').trim()}
                                            </h3>
                                            {resume.company && (
                                                <p className="text-gray-500 text-sm mb-2 line-clamp-1">{resume.company}</p>
                                            )}
                                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                                <Calendar size={14} />
                                                <span>{new Date(resume.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredApps.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Job Applications</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredApps.map(app => (
                                        <div
                                            key={app.id}
                                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer group"
                                            onClick={() => onOpenApplication(app.id)}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <Briefcase size={20} />
                                                </div>
                                                <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>

                                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{app.jobTitle}</h3>
                                            <p className="text-gray-500 text-sm mb-4 line-clamp-1">{app.companyName}</p>

                                            <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
};
