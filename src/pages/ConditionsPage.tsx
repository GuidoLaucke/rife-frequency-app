import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { db } from '@/lib/db';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import type { Condition } from '@/types';

export function ConditionsPage() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: '' });

  useEffect(() => { loadConditions(); }, []);

  const loadConditions = async () => {
    const data = await db.getAll('conditions');
    setConditions(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const condData: Condition = {
      id: editingId || crypto.randomUUID(),
      ...formData,
      created_at: new Date(),
    };

    if (editingId) {
      await db.update('conditions', condData);
      toast.success('Condition updated');
    } else {
      await db.add('conditions', condData);
      toast.success('Condition created');
    }

    setShowModal(false);
    setFormData({ name: '', description: '', category: '' });
    setEditingId(null);
    loadConditions();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this condition?')) {
      await db.delete('conditions', id);
      toast.success('Condition deleted');
      loadConditions();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-heading font-bold text-white mb-2">Conditions</h1>
              <p className="text-muted-foreground">Manage health conditions</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 font-medium shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-105">
              <Plus className="w-5 h-5" />
              New Condition
            </button>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Description</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {conditions.map((cond) => (
                  <tr key={cond.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-white font-medium">{cond.name}</td>
                    <td className="px-6 py-4 text-accent text-sm">{cond.category}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{cond.description}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setEditingId(cond.id); setFormData({ name: cond.name, description: cond.description, category: cond.category }); setShowModal(true); }} className="text-muted-foreground hover:text-white mr-3">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cond.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">{editingId ? 'Edit' : 'New'} Condition</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg p-4 text-white resize-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
