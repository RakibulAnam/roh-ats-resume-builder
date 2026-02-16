import React, { useState } from 'react';
import { Award } from '../../../domain/entities/Resume';
import { profileRepository } from '../../../infrastructure/config/dependencies';
import { useAuth } from '../../../infrastructure/auth/AuthContext';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Save, Award as AwardIcon } from 'lucide-react';

interface Props {
    items: Award[];
    onRefresh: () => void;
}

export const AwardSection = ({ items, onRefresh }: Props) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Award>>({});
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setFormData({ title: '', issuer: '', date: '', description: '' });
        setEditingId(null);
        setIsEditing(false);
    };

    const handleAddNew = () => { resetForm(); setIsEditing(true); };

    const handleEdit = (item: Award) => {
        setFormData({ ...item });
        setEditingId(item.id);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this award?')) return;
        try {
            await profileRepository.deleteAward(id);
            toast.success('Deleted successfully');
            onRefresh();
        } catch (error) { toast.error('Failed to delete'); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await profileRepository.saveAward(user.id, {
                id: editingId || '',
                title: formData.title || '',
                issuer: formData.issuer || '',
                date: formData.date || '',
                description: formData.description || '',
            });
            toast.success('Award saved');
            resetForm();
            onRefresh();
        } catch (error) { toast.error('Failed to save award'); } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><AwardIcon size={20} /> Awards</h3>
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
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title</label>
                            <input required className="w-full p-2 border rounded-lg" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Employee of the Month" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Issuer</label>
                            <input required className="w-full p-2 border rounded-lg" value={formData.issuer || ''} onChange={e => setFormData({ ...formData, issuer: e.target.value })} placeholder="e.g. Google" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
                            <input type="month" className="w-full p-2 border rounded-lg" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                        <textarea className="w-full p-2 border rounded-lg h-24 text-sm" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Recognized for outstanding performance in Q2..." />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm">Cancel</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"><Save size={16} /> Save</button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {items.length === 0 && !isEditing && <p className="text-center text-gray-400 py-4 text-sm">No awards added yet.</p>}
                {items.map(item => (
                    <div key={item.id} className="bg-white border border-gray-100 p-4 rounded-xl hover:shadow-sm transition-shadow group relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-900">{item.title}</h4>
                                <div className="text-indigo-600 font-medium text-sm">{item.issuer}</div>
                                <div className="text-gray-400 text-xs mt-1">{item.date}</div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        {item.description && <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{item.description}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};
