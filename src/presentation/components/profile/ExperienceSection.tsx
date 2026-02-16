import React, { useState } from 'react';
import { WorkExperience } from '../../../domain/entities/Resume';
import { profileRepository } from '../../../infrastructure/config/dependencies';
import { useAuth } from '../../../infrastructure/auth/AuthContext';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Save, X, Briefcase } from 'lucide-react';

interface Props {
    experiences: WorkExperience[];
    onRefresh: () => void;
}

export const ExperienceSection = ({ experiences, onRefresh }: Props) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<WorkExperience>>({});
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setFormData({
            company: '',
            role: '',
            startDate: '',
            endDate: '',
            isCurrent: false,
            rawDescription: '',
        });
        setEditingId(null);
        setIsEditing(false);
    };

    const handleAddNew = () => {
        resetForm();
        setIsEditing(true);
    };

    const handleEdit = (exp: WorkExperience) => {
        setFormData({
            ...exp
        });
        setEditingId(exp.id);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this experience?')) return;
        try {
            await profileRepository.deleteExperience(id);
            toast.success('Deleted successfully');
            onRefresh();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await profileRepository.saveExperience(user.id, {
                id: editingId || '', // Empty ID for new, handled by Repo
                company: formData.company || '',
                role: formData.role || '',
                startDate: formData.startDate || '',
                endDate: formData.endDate || '',
                isCurrent: formData.isCurrent || false,
                rawDescription: formData.rawDescription || '',
                refinedBullets: [],
            });
            toast.success('Experience saved');
            resetForm();
            onRefresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save experience');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Briefcase size={20} /> Work Experience
                </h3>
                {!isEditing && (
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-1 text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                    >
                        <Plus size={16} /> Add New
                    </button>
                )}
            </div>

            {isEditing && (
                <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Company</label>
                            <input
                                required
                                className="w-full p-2 border rounded-lg"
                                value={formData.company || ''}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                                placeholder="Company Name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Role</label>
                            <input
                                required
                                className="w-full p-2 border rounded-lg"
                                value={formData.role || ''}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                placeholder="Job Title"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</label>
                            <input
                                type="month"
                                className="w-full p-2 border rounded-lg"
                                value={formData.startDate || ''}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Date</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="month"
                                    disabled={formData.isCurrent}
                                    className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-400"
                                    value={formData.endDate || ''}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={formData.isCurrent || false}
                                        onChange={e => setFormData({ ...formData, isCurrent: e.target.checked, endDate: e.target.checked ? 'Present' : '' })}
                                    />
                                    Current
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                        <textarea
                            className="w-full p-2 border rounded-lg h-32 text-sm"
                            value={formData.rawDescription || ''}
                            onChange={e => setFormData({ ...formData, rawDescription: e.target.value })}
                            placeholder="- Built feature X using React..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={16} /> Save
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {experiences.length === 0 && !isEditing && (
                    <p className="text-center text-gray-400 py-4 text-sm">No experience added yet.</p>
                )}
                {experiences.map(exp => (
                    <div key={exp.id} className="bg-white border border-gray-100 p-4 rounded-xl hover:shadow-sm transition-shadow group relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-900">{exp.role}</h4>
                                <div className="text-indigo-600 font-medium text-sm">{exp.company}</div>
                                <div className="text-gray-400 text-xs mt-1">
                                    {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(exp)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(exp.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        {exp.rawDescription && (
                            <p className="mt-3 text-sm text-gray-600 whitespace-pre-line line-clamp-2">
                                {exp.rawDescription}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
