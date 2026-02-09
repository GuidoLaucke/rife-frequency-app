import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { db } from '@/lib/db';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import type { Sequence, Frequency, SequenceFrequency } from '@/types';

export function SequencesPage() {
  const { user } = useAuth();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [seqFreqs, setSeqFreqs] = useState<SequenceFrequency[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [seqs, freqs] = await Promise.all([
      db.getAll('sequences'),
      db.getAll('frequencies'),
    ]);
    setSequences(seqs);
    setFrequencies(freqs);
  };

  const addFreqToSequence = () => {
    setSeqFreqs([...seqFreqs, { hz: 0, duration: 60 }]);
  };

  const removeFreqFromSequence = (index: number) => {
    setSeqFreqs(seqFreqs.filter((_, i) => i !== index));
  };

  const updateSeqFreq = (index: number, field: 'hz' | 'duration', value: number) => {
    const updated = [...seqFreqs];
    updated[index][field] = value;
    setSeqFreqs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seqFreqs.length === 0) {
      toast.error('Add at least one frequency');
      return;
    }

    const seqData: Sequence = {
      id: crypto.randomUUID(),
      name: formData.name,
      frequencies: seqFreqs,
      created_by: user!.id,
      created_at: new Date(),
    };

    await db.add('sequences', seqData);
    toast.success('Sequence created');
    setShowModal(false);
    setFormData({ name: '' });
    setSeqFreqs([]);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this sequence?')) {
      await db.delete('sequences', id);
      toast.success('Sequence deleted');
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-heading font-bold text-white mb-2">Sequences</h1>
              <p className="text-muted-foreground">Manage frequency sequences</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 font-medium">
              <Plus className="w-5 h-5" />
              New Sequence
            </button>
          </div>

          <div className="space-y-4">
            {sequences.map((seq) => (
              <div key={seq.id} className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-semibold text-white mb-2">{seq.name}</h3>
                    <p className="text-sm text-muted-foreground">{seq.frequencies.length} frequencies</p>
                  </div>
                  <button onClick={() => handleDelete(seq.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {seq.frequencies.map((freq, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm">
                      <span className="text-accent font-mono font-bold">{freq.hz} Hz</span>
                      <span className="text-muted-foreground">for {freq.duration}s</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">New Sequence</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sequence Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} required className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Frequencies</label>
                  <button type="button" onClick={addFreqToSequence} className="text-primary hover:text-primary/80 text-sm font-medium">+ Add Frequency</button>
                </div>
                <div className="space-y-3">
                  {seqFreqs.map((freq, i) => (
                    <div key={i} className="flex gap-3 items-center bg-white/5 p-3 rounded-lg">
                      <div className="flex-1">
                        <input type="number" placeholder="Hz" value={freq.hz || ''} onChange={(e) => updateSeqFreq(i, 'hz', parseFloat(e.target.value) || 0)} className="w-full bg-black/20 border-white/10 rounded-lg h-10 px-3 text-white text-sm" />
                      </div>
                      <div className="flex-1">
                        <input type="number" placeholder="Duration (s)" value={freq.duration} onChange={(e) => updateSeqFreq(i, 'duration', parseInt(e.target.value) || 0)} className="w-full bg-black/20 border-white/10 rounded-lg h-10 px-3 text-white text-sm" />
                      </div>
                      <button type="button" onClick={() => removeFreqFromSequence(i)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium">Create Sequence</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
