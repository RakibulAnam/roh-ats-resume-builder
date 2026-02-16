// Infrastructure Layer - Local Storage Repository Implementation

import { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import { ResumeData } from '../../domain/entities/Resume';

const STORAGE_KEY = 'ats_resume_draft';

export class LocalStorageResumeRepository implements IResumeRepository {
    save(data: ResumeData): void {
        try {
            const serializableData = JSON.stringify(data);
            localStorage.setItem(STORAGE_KEY, serializableData);
        } catch (error) {
            console.warn('Failed to save draft to localStorage:', error);
        }
    }

    load(): ResumeData | null {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;
            return JSON.parse(stored) as ResumeData;
        } catch (error) {
            console.warn('Failed to load draft from localStorage:', error);
            return null;
        }
    }

    // Stubs for interface compliance (Local storage strategy doesn't support cloud generation features yet)
    async saveGeneratedResume(userId: string, data: ResumeData, title: string): Promise<string> {
        throw new Error('Method not implemented.');
    }
    async updateGeneratedResume(id: string, data: ResumeData, title: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    async getGeneratedResumes(userId: string): Promise<{ id: string; title: string; date: string; company?: string }[]> {
        return [];
    }
    async getGeneratedResume(id: string): Promise<ResumeData | null> {
        return null;
    }
    async deleteGeneratedResume(id: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
