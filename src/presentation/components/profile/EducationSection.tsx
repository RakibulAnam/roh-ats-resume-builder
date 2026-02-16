import React, { useState } from 'react';
import { Education } from '../../../domain/entities/Resume';
import { profileRepository } from '../../../infrastructure/config/dependencies';
import { useAuth } from '../../../infrastructure/auth/AuthContext';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Save, GraduationCap } from 'lucide-react';

interface Props {
    educations: Education[];
    onRefresh: () => void;
}

export const EducationSection = ({ educations, onRefresh }: Props) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Education>>({});
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setFormData({
            school: '',
            degree: '',
            field: '',
            startDate: '',
            endDate: '',
            gpa: '',
        });
        setEditingId(null);
        setIsEditing(false);
    };

    const handleAddNew = () => {
        resetForm();
        setIsEditing(true);
    };

    const handleEdit = (edu: Education) => {
        setFormData({ ...edu });
        setEditingId(edu.id);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await profileRepository.deleteEducation(id);
            toast.success('Deleted');
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
            await profileRepository.saveEducation(user.id, {
                id: editingId || '',
                school: formData.school || '',
                degree: formData.degree || '',
                field: formData.field || '',
                startDate: formData.startDate || '',
                endDate: formData.endDate || '',
                gpa: formData.gpa,
            });
            toast.success('Saved');
            resetForm();
            onRefresh();
        } catch (error) {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <GraduationCap size={20} /> Education
                </h3>
                {!isEditing && (
                    <button onClick={handleAddNew} className="flex items-center gap-1 text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium transition-colors">
                        <Plus size={16} /> Add New
                    </button>
                )}
            </div>

            {isEditing && (
                <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">School</label>
                            <input
                                required
                                className="w-full p-2 border rounded-lg"
                                value={formData.school || ''}
                                onChange={e => setFormData({ ...formData, school: e.target.value })}
                                placeholder="e.g. Stanford University"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Degree</label>
                            <input
                                required
                                className="w-full p-2 border rounded-lg"
                                value={formData.degree || ''}
                                onChange={e => setFormData({ ...formData, degree: e.target.value })}
                                placeholder="e.g. Bachelor of Science"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Field of Study</label>
                            <input
                                required
                                className="w-full p-2 border rounded-lg"
                                value={formData.field || ''}
                                onChange={e => setFormData({ ...formData, field: e.target.value })}
                                placeholder="e.g. Computer Science"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">GPA (Optional)</label>
                            <input
                                className="w-full p-2 border rounded-lg"
                                value={formData.gpa || ''}
                                onChange={e => setFormData({ ...formData, gpa: e.target.value })}
                                placeholder="e.g. 3.8/4.0"
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
                                    className="w-full p-2 border rounded-lg disabled:bg-gray-200 disabled:text-gray-400"
                                    value={formData.endDate || ''}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    disabled={formData.endDate === 'Present'}
                                />
                                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={formData.endDate === 'Present'}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.checked ? 'Present' : '' })}
                                    />
                                    Current
                                </label>
                            </div>
                        </div>
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
                {educations.length === 0 && !isEditing && <p className="text-center text-gray-400 py-4 text-sm">No education added.</p>}
                {educations.map(edu => (
                    <div key={edu.id} className="bg-white border border-gray-100 p-4 rounded-xl hover:shadow-sm transition-shadow group relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-900">{edu.school}</h4>
                                <div className="text-gray-700 text-sm">{edu.degree} in {edu.field}</div>
                                <div className="text-gray-400 text-xs mt-1">{edu.startDate} - {edu.endDate} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}</div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(edu)} className="icon-btn"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(edu.id)} className="icon-btn-danger"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
