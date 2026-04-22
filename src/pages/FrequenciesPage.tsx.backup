import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { db } from '@/lib/db';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import type { Frequency } from '@/types';

export function FrequenciesPage() {
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPredefined, setEditingPredefined] = useState(false);
  const [formData, setFormData] = useState({ 
    hz: '', 
    name: '', 
    description: '', 
    color: '#FFFFFF' 
  });

  useEffect(() => { loadFrequencies(); }, []);

  const loadFrequencies = async () => {
    const data = await db.getAll('frequencies');
    setFrequencies(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const freq = frequencies.find(f => f.id === editingId);
    
    const freqData: Frequency = {
      id: editingId || crypto.randomUUID(),
      hz: editingPredefined ? freq!.hz : parseFloat(formData.hz),
      name: editingPredefined ? freq!.name : formData.name,
      description: editingPredefined ? freq!.description : formData.description,
      color: formData.color,
      conditions: freq?.conditions || [],
      is_predefined: freq?.is_predefined || false,
      created_at: new Date(),
    };

    if (editingId) {
      await db.update('frequencies', freqData);
      toast.success('Frequenz aktualisiert');
    } else {
      await db.add('frequencies', freqData);
      toast.success('Frequenz erstellt');
    }

    setShowModal(false);
    setFormData({ hz: '', name: '', description: '', color: '#FFFFFF' });
    setEditingId(null);
    setEditingPredefined(false);
    loadFrequencies();
  };

  const handleEdit = (freq: Frequency) => {
    setEditingId(freq.id);
    setEditingPredefined(freq.is_predefined);
    setFormData({
      hz: freq.hz.toString(),
      name: freq.name,
      description: freq.description,
      color: freq.color || '#FFFFFF',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const freq = frequencies.find(f => f.id === id);
    if (freq?.is_predefined) {
      toast.error('Vordefinierte Frequenzen können nicht gelöscht werden');
      return;
    }
    if (confirm('Diese Frequenz löschen?')) {
      await db.delete('frequencies', id);
      toast.success('Frequenz gelöscht');
      loadFrequencies();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-heading font-bold text-white mb-2">Frequenzen</h1>
              <p className="text-muted-foreground">Verwalte Frequenzen</p>
            </div>
            <button
              onClick={() => { 
                setShowModal(true); 
                setEditingId(null); 
                setEditingPredefined(false);
                setFormData({ hz: '', name: '', description: '', color: '#FFFFFF' }); 
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 font-medium shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Neue Frequenz
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frequencies.map((freq) => (
              <div key={freq.id} className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {freq.color && (
                      <div
                        className="w-4 h-4 rounded-full border border-white/30"
                        style={{ backgroundColor: freq.color, boxShadow: `0 0 8px ${freq.color}` }}
                      />
                    )}
                    <div>
                      <h3 className="font-mono text-accent font-semibold text-lg">{freq.hz} Hz</h3>
                      <p className="text-sm text-white font-medium">{freq.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(freq)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
                      title={freq.is_predefined ? 'Farbe bearbeiten' : 'Bearbeiten'}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    {!freq.is_predefined && (
                      <button
                        onClick={() => handleDelete(freq.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                        title="Löschen"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{freq.description}</p>
                {freq.is_predefined && (
                  <span className="inline-block text-xs px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                    Vordefiniert
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">
              {editingId ? (editingPredefined ? 'Farbe bearbeiten' : 'Bearbeiten') : 'Neue'} Frequenz
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Hz *</label>
                <input
                  type="number"
                  value={formData.hz}
                  onChange={(e) => setFormData({ ...formData, hz: e.target.value })}
                  required={!editingPredefined}
                  disabled={editingPredefined}
                  min="1"
                  max="20000"
                  step="0.01"
                  className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!editingPredefined}
                  disabled={editingPredefined}
                  className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={editingPredefined}
                  rows={3}
                  className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg p-4 text-white resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Farbe</label>
                <div className="flex gap-2 items-center">
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
                    className="flex-1 bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white font-mono"
                  />
                  <div 
                    className="w-11 h-11 rounded-lg border border-white/10"
                    style={{ backgroundColor: formData.color, boxShadow: `0 0 16px ${formData.color}` }}
                  />
                </div>
                {editingPredefined && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Bei vordefinierten Frequenzen kann nur die Farbe geändert werden
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium">
                  Speichern
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
