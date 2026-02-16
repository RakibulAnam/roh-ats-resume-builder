// Domain Layer - Repository Interface

import { ResumeData } from '../entities/Resume';

export interface IResumeRepository {
    save(data: ResumeData): void;
    load(): ResumeData | null;
    saveGeneratedResume(userId: string, data: ResumeData, title: string): Promise<string>;
    updateGeneratedResume(id: string, data: ResumeData, title: string): Promise<void>;
    getGeneratedResumes(userId: string): Promise<{ id: string; title: string; date: string; company?: string }[]>;
    getGeneratedResume(id: string): Promise<ResumeData | null>;
    deleteGeneratedResume(id: string): Promise<void>;
}
