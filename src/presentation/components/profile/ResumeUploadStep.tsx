import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { resumeExtractor } from '../../../infrastructure/config/dependencies';
import { ExtractedProfileData } from '../../../domain/usecases/ExtractResumeUseCase';
import { toast } from 'sonner';

interface Props {
    onExtracted: (data: ExtractedProfileData) => void;
    onSkip: () => void;
}

export const ResumeUploadStep: React.FC<Props> = ({ onExtracted, onSkip }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const processFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            toast.error('Please upload a PDF file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('File size must be less than 5MB.');
            return;
        }

        setIsProcessing(true);

        try {
            // Convert file to base64
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = async () => {
                try {
                    const base64String = reader.result as string;
                    // Extract just the base64 part, removing the data... prefix
                    const base64Data = base64String.split(',')[1];

                    const extractedData = await resumeExtractor.extract(base64Data, file.type);
                    toast.success('Resume analyzed successfully!');
                    onExtracted(extractedData);
                } catch (error) {
                    console.error('Parsing error:', error);
                    toast.error(error instanceof Error ? error.message : 'Failed to analyze resume.');
                    setIsProcessing(false);
                }
            };

            reader.onerror = () => {
                toast.error('Failed to read file.');
                setIsProcessing(false);
            };

        } catch (error) {
            console.error('Unexpected error:', error);
            setIsProcessing(false);
            toast.error('An unexpected error occurred.');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-indigo-600" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Import Your Resume</h2>
                <p className="text-gray-500">
                    Upload your existing resume to automatically fill out your profile using AI. You can review and edit everything in the next steps.
                </p>
            </div>

            <div
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${isDragging
                        ? 'border-indigo-500 bg-indigo-50'
                        : isProcessing
                            ? 'border-gray-200 bg-gray-50'
                            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="application/pdf"
                    className="hidden"
                    disabled={isProcessing}
                />

                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    {isProcessing ? (
                        <>
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Analyzing Document</h3>
                                <p className="text-sm text-gray-500 mt-1">Our AI is extracting your profile data...</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-indigo-100 transition-colors">
                                <Upload className="w-8 h-8 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Click to upload or drag and drop</h3>
                                <p className="text-sm text-gray-500 mt-1">PDF files only (max 5MB)</p>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-4 px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                Select File
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span>OR</span>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <button
                onClick={onSkip}
                disabled={isProcessing}
                className="w-full py-3 px-4 border-2 border-gray-200 text-gray-700 bg-white rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                Fill Profile Manually
            </button>

            <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 mt-6">
                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-blue-800 leading-relaxed">
                    <strong>Privacy Note:</strong> Your resume is processed securely in your browser to extract text, and only the text is sent to our AI provider. The file itself is not stored.
                </p>
            </div>
        </div>
    );
};
