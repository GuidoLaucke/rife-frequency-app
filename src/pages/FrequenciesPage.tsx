import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { db } from '@/lib/db';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import type { Frequency } from '@/types';

export function FrequenciesPage() {
  const { user } = useAuth();
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', hz: '', description: '', color: '#FFFFFF' });

  useEffect(() => { loadFrequencies(); }, []);

  const loadFrequencies = async () => {
    const data = await db.getAll('frequencies');
    setFrequencies(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hz = parseFloat(formData.hz);
    if (isNaN(hz) || hz < 1 || hz > 20000) {
      toast.error('Invalid frequency (1-20000 Hz)');
      return;
    }

    const freqData: Frequency = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      hz,
      description: formData.description,
      color: formData.color || undefined,
      conditions: [],
      is_predefined: false,
      created_at: new Date(),
      created_by: user?.id,
    };

    if (editingId) {
      await db.update('frequencies', freqData);
      toast.success('Frequency updated');
    } else {
      await db.add('frequencies', freqData);
      toast.success('Frequency created');
    }

    setShowModal(false);
    setFormData({ name: '', hz: '', description: '', color: '#FFFFFF' });
    setEditingId(null);
    loadFrequencies();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this frequency?')) {
      await db.delete('frequencies', id);
      toast.success('Frequency deleted');
      loadFrequencies();
    }
  };

  const handleEdit = (freq: Frequency) => {
    setEditingId(freq.id);
    setFormData({ name: freq.name, hz: freq.hz.toString(), description: freq.description, color: freq.color || '#FFFFFF' });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-heading font-bold text-white mb-2">Frequencies</h1>
              <p className="text-muted-foreground">Manage your frequency library</p>
            </div>
            <button
              onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', hz: '', description: '', color: '#FFFFFF' }); }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 font-medium shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              New Frequency
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frequencies.map((freq) => (
              <div key={freq.id} className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {freq.color && (
                      <div 
                        className="w-4 h-4 rounded-full border border-white/30"
                        style={{ backgroundColor: freq.color, boxShadow: `0 0 8px ${freq.color}` }}
                        title={`Color: ${freq.color}`}
                      />
                    )}
                    <h3 className="font-heading font-semibold text-white">{freq.name}</h3>
                  </div>
                  {!freq.is_predefined && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(freq)} className="text-muted-foreground hover:text-white">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(freq.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-2xl font-mono font-bold text-accent mb-2">{freq.hz} Hz</p>
                <p className="text-sm text-muted-foreground">{freq.description}</p>
                {freq.is_predefined && <span className="inline-block mt-3 text-xs px-2 py-1 rounded bg-primary/20 text-primary">Predefined</span>}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">{editingId ? 'Edit' : 'New'} Frequency</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Frequency (Hz)</label>
                <input
                  type="number"
                  value={formData.hz}
                  onChange={(e) => setFormData({ ...formData, hz: e.target.value })}
                  required
                  min="1"
                  max="20000"
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg p-4 text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Color (Optional)</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-11 w-20 bg-black/20 border border-white/10 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#FFFFFF"
                    className="flex-1 bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white font-mono text-sm"
                  />
                  <div 
                    className="w-11 h-11 rounded-lg border border-white/10"
                    style={{ backgroundColor: formData.color, boxShadow: `0 0 20px ${formData.color}` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This color will be shown in the player when this frequency is playing
                </p>
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
