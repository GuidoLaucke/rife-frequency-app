import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { getSequences, createSequence, updateSequence, deleteSequence, getFrequencies, getPersons, assignSequenceToPerson, removeSequenceFromPerson, getPersonsForSequence } from '@/lib/db';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

export function SequencesPage() {
  const { user } = useAuth();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPersonsModal, setShowPersonsModal] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [seqFreqs, setSeqFreqs] = useState<SequenceFrequency[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [seqs, freqs, pers] = await Promise.all([
      db.getAll('sequences'),
      db.getAll('frequencies'),
      db.getAll('persons'),
    ]);
    setSequences(seqs);
    setFrequencies(freqs);
    setPersons(pers);
  };

  const addFreqToSequence = () => {
    setSeqFreqs([...seqFreqs, { hz: 0, duration: 60, color: '#FFFFFF' }]);
  };

  const removeFreqFromSequence = (index: number) => {
    setSeqFreqs(seqFreqs.filter((_, i) => i !== index));
  };

  const updateSeqFreq = (index: number, field: keyof SequenceFrequency, value: any) => {
    const updated = [...seqFreqs];
    updated[index] = { ...updated[index], [field]: value };
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
      assigned_persons: [],
      created_by: user?.id || '',
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

  const handleAssignPersons = (seq: Sequence) => {
    setSelectedSequence(seq);
    setShowPersonsModal(true);
  };

  const togglePersonAssignment = async (personId: string) => {
    if (!selectedSequence) return;

    const currentPersons = selectedSequence.assigned_persons || [];
    const isAssigned = currentPersons.includes(personId);

    const updatedSequence = {
      ...selectedSequence,
      assigned_persons: isAssigned
        ? currentPersons.filter(id => id !== personId)
        : [...currentPersons, personId],
    };

    // Update sequence
    await db.update('sequences', updatedSequence);

    // Update person
    const person = persons.find(p => p.id === personId);
    if (person) {
      const currentSeqs = person.assigned_sequences || [];
      const updatedPerson = {
        ...person,
        assigned_sequences: isAssigned
          ? currentSeqs.filter(id => id !== selectedSequence.id)
          : [...currentSeqs, selectedSequence.id],
      };
      await db.update('persons', updatedPerson);
    }

    setSelectedSequence(updatedSequence);
    toast.success(isAssigned ? 'Person removed' : 'Person assigned');
    loadData();
  };

  const getAssignedPersonsNames = (seq: Sequence): string => {
    const assignedPersons = persons.filter(p => 
      seq.assigned_persons?.includes(p.id)
    );
    return assignedPersons.map(p => p.name).join(', ') || 'None';
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-heading font-bold text-white mb-2">Sequences</h1>
              <p className="text-muted-foreground">Create frequency sequences</p>
            </div>
            <button
              onClick={() => { setShowModal(true); setSeqFreqs([]); setFormData({ name: '' }); }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 font-medium"
            >
              <Plus className="w-5 h-5" />
              New Sequence
            </button>
          </div>

          <div className="space-y-4">
            {sequences.map((seq) => (
              <div key={seq.id} className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-white text-lg mb-2">{seq.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {seq.frequencies.length} frequencies • Total: {seq.frequencies.reduce((sum, f) => sum + f.duration, 0)}s
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Assigned to: <span className="text-white">{getAssignedPersonsNames(seq)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAssignPersons(seq)}
                      className="text-muted-foreground hover:text-primary"
                      title="Assign to persons"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(seq.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {seq.frequencies.map((freq, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-lg p-3">
                      {freq.color && (
                        <div
                          className="w-3 h-3 rounded-full border border-white/30"
                          style={{ backgroundColor: freq.color, boxShadow: `0 0 8px ${freq.color}` }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-mono text-accent font-semibold">{freq.hz} Hz</p>
                        <p className="text-xs text-muted-foreground">{freq.duration}s</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Create Sequence Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">New Sequence</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sequence Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Frequencies</label>
                  <button type="button" onClick={addFreqToSequence} className="text-sm text-primary hover:text-primary/80">
                    + Add Frequency
                  </button>
                </div>

                <div className="space-y-3">
                  {seqFreqs.map((freq, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Frequency {idx + 1}</span>
                        <button type="button" onClick={() => removeFreqFromSequence(idx)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Hz</label>
                          <input
                            type="number"
                            value={freq.hz || ''}
                            onChange={(e) => updateSeqFreq(idx, 'hz', parseFloat(e.target.value))}
                            min="1"
                            max="20000"
                            required
                            className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-10 px-3 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Duration (s)</label>
                          <input
                            type="number"
                            value={freq.duration || ''}
                            onChange={(e) => updateSeqFreq(idx, 'duration', parseInt(e.target.value))}
                            min="1"
                            required
                            className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-10 px-3 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Color (Optional)</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={freq.color || '#FFFFFF'}
                            onChange={(e) => updateSeqFreq(idx, 'color', e.target.value)}
                            className="h-10 w-16 bg-black/20 border border-white/10 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={freq.color || '#FFFFFF'}
                            onChange={(e) => updateSeqFreq(idx, 'color', e.target.value)}
                            placeholder="#FFFFFF"
                            className="flex-1 bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-10 px-3 text-white font-mono text-sm"
                          />
                          <div 
                            className="w-10 h-10 rounded-lg border border-white/10"
                            style={{ backgroundColor: freq.color, boxShadow: `0 0 16px ${freq.color}` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {seqFreqs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No frequencies added yet</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium">
                  Create Sequence
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Persons Modal */}
      {showPersonsModal && selectedSequence && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPersonsModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">
              Assign to Persons
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sequence: <span className="text-white font-medium">{selectedSequence.name}</span>
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {persons.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No persons available</p>
              ) : (
                persons.map((person) => {
                  const isAssigned = selectedSequence.assigned_persons?.includes(person.id);
                  return (
                    <label
                      key={person.id}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => togglePersonAssignment(person.id)}
                        className="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">{person.name}</p>
                        {person.email && (
                          <p className="text-xs text-muted-foreground">{person.email}</p>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setShowPersonsModal(false)}
              className="w-full mt-6 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
