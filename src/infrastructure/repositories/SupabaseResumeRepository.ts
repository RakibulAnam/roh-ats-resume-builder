import { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import { ResumeData } from '../../domain/entities/Resume';
import { supabase } from '../supabase/client';

export class SupabaseResumeRepository implements IResumeRepository {
    private readonly DRAFT_KEY = 'resume_draft';

    // Local Storage for Drafts (Current Work in Progress)
    save(data: ResumeData): void {
        try {
            localStorage.setItem(this.DRAFT_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving draft to local storage:', error);
        }
    }

    load(): ResumeData | null {
        try {
            const data = localStorage.getItem(this.DRAFT_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading draft from local storage:', error);
            return null;
        }
    }

    // Supabase for Generated/Finalized Resumes
    async saveGeneratedResume(userId: string, data: ResumeData, title: string): Promise<string> {
        const { data: inserted, error } = await supabase
            .from('generated_resumes')
            .insert({
                user_id: userId,
                title: title,
                data: data
            })
            .select('id')
            .single();

        if (error) throw error;
        return inserted.id;
    }

    async updateGeneratedResume(id: string, data: ResumeData, title: string): Promise<void> {
        const { error } = await supabase
            .from('generated_resumes')
            .update({
                title: title,
                data: data,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    }

    async getGeneratedResumes(userId: string): Promise<{ id: string; title: string; date: string; company?: string }[]> {
        const { data, error } = await supabase
            .from('generated_resumes')
            .select('id, title, created_at, data')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map(item => ({
            id: item.id,
            title: item.title,
            date: item.created_at,
            company: item.data?.targetJob?.company
        }));
    }

    async getGeneratedResume(id: string): Promise<ResumeData | null> {
        const { data, error } = await supabase
            .from('generated_resumes')
            .select('data')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data.data as ResumeData;
    }

    async deleteGeneratedResume(id: string): Promise<void> {
        const { error } = await supabase
            .from('generated_resumes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
