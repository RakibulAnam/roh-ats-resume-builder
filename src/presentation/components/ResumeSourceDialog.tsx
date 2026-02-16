// Resume Source Dialog - Modal for choosing between profile data or starting fresh

import React from 'react';
import { User, FileText, X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onChooseProfile: () => void;
    onChooseFresh: () => void;
}

export const ResumeSourceDialog: React.FC<Props> = ({
    isOpen,
    onClose,
    onChooseProfile,
    onChooseFresh
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Create New Application</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        How would you like to start your new application?
                    </p>

                    <div className="space-y-4">
                        {/* Option 1: From Profile */}
                        <button
                            onClick={onChooseProfile}
                            className="w-full p-5 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <User size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">Use My Profile</h3>
                                    <p className="text-sm text-gray-500">
                                        Pre-fill the application with your saved profile data including experience, projects, and skills.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Option 2: Start Fresh */}
                        <button
                            onClick={onChooseFresh}
                            className="w-full p-5 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50/50 transition-all text-left group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <FileText size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">Start From Scratch</h3>
                                    <p className="text-sm text-gray-500">
                                        Create a completely new application without using your saved profile data.
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
