import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { db } from '@/lib/db';
import { Plus, Trash2, Edit, ListOrdered } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import type { Person, Condition, Frequency, Sequence, SequenceFrequency } from '@/types';

export function PersonsPage() {
  const { user } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSequencesModal, setShowSequencesModal] = useState(false);
  const [showNewSequenceModal, setShowNewSequenceModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
    conditions: [] as string[],
    assigned_frequencies: [] as string[],
  });
  
  // For new sequence creation
  const [newSeqName, setNewSeqName] = useState('');
  const [newSeqFreqs, setNewSeqFreqs] = useState<SequenceFrequency[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [pers, conds, freqs, seqs] = await Promise.all([
      db.getAll('persons'),
      db.getAll('conditions'),
      db.getAll('frequencies'),
      db.getAll('sequences'),
    ]);
    setPersons(pers);
    setConditions(conds);
    setFrequencies(freqs);
    setSequences(seqs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const personData: Person = {
      id: editingId || crypto.randomUUID(),
      ...formData,
      assigned_sequences: editingId 
        ? persons.find(p => p.id === editingId)?.assigned_sequences || []
        : [],
      created_by: user?.id || '',
      created_at: new Date(),
    };

    if (editingId) {
      await db.update('persons', personData);
      toast.success('Person updated');
    } else {
      await db.add('persons', personData);
      toast.success('Person created');
    }

    setShowModal(false);
    setFormData({ name: '', email: '', notes: '', conditions: [], assigned_frequencies: [] });
    setEditingId(null);
    loadData();
  };

  const handleEdit = (person: Person) => {
    setEditingId(person.id);
    setFormData({
      name: person.name,
      email: person.email || '',
      notes: person.notes || '',
      conditions: person.conditions || [],
      assigned_frequencies: person.assigned_frequencies || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this person?')) {
      await db.delete('persons', id);
      toast.success('Person deleted');
      loadData();
    }
  };

  const handleManageSequences = (person: Person) => {
    setSelectedPerson(person);
    setShowSequencesModal(true);
  };

  const toggleSequenceAssignment = async (sequenceId: string) => {
    if (!selectedPerson) return;

    const currentSeqs = selectedPerson.assigned_sequences || [];
    const isAssigned = currentSeqs.includes(sequenceId);

    const updatedPerson = {
      ...selectedPerson,
      assigned_sequences: isAssigned
        ? currentSeqs.filter(id => id !== sequenceId)
        : [...currentSeqs, sequenceId],
    };

    // Update person
    await db.update('persons', updatedPerson);

    // Update sequence
    const sequence = sequences.find(s => s.id === sequenceId);
    if (sequence) {
      const currentPersons = sequence.assigned_persons || [];
      const updatedSequence = {
        ...sequence,
        assigned_persons: isAssigned
          ? currentPersons.filter(id => id !== selectedPerson.id)
          : [...currentPersons, selectedPerson.id],
      };
      await db.update('sequences', updatedSequence);
    }

    setSelectedPerson(updatedPerson);
    toast.success(isAssigned ? 'Sequence removed' : 'Sequence assigned');
    loadData();
  };

  const handleCreateNewSequence = () => {
    setNewSeqName('');
    setNewSeqFreqs([{ hz: 0, duration: 60, color: '#FFFFFF' }]);
    setShowNewSequenceModal(true);
  };

  const addFreqToNewSeq = () => {
    setNewSeqFreqs([...newSeqFreqs, { hz: 0, duration: 60, color: '#FFFFFF' }]);
  };

  const removeFreqFromNewSeq = (index: number) => {
    setNewSeqFreqs(newSeqFreqs.filter((_, i) => i !== index));
  };

  const updateNewSeqFreq = (index: number, field: keyof SequenceFrequency, value: any) => {
    const updated = [...newSeqFreqs];
    updated[index] = { ...updated[index], [field]: value };
    setNewSeqFreqs(updated);
  };

  const handleSubmitNewSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || newSeqFreqs.length === 0) {
      toast.error('Add at least one frequency');
      return;
    }

    const newSequence: Sequence = {
      id: crypto.randomUUID(),
      name: newSeqName,
      frequencies: newSeqFreqs,
      assigned_persons: [selectedPerson.id],
      created_by: user?.id || '',
      created_at: new Date(),
    };

    await db.add('sequences', newSequence);

    // Update person with new sequence
    const updatedPerson = {
      ...selectedPerson,
      assigned_sequences: [...(selectedPerson.assigned_sequences || []), newSequence.id],
    };
    await db.update('persons', updatedPerson);

    toast.success('Sequence created and assigned');
    setShowNewSequenceModal(false);
    setSelectedPerson(updatedPerson);
    loadData();
  };

  const getAssignedSequencesNames = (person: Person): string => {
    const assignedSeqs = sequences.filter(s => 
      person.assigned_sequences?.includes(s.id)
    );
    return assignedSeqs.map(s => s.name).join(', ') || 'None';
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-heading font-bold text-white mb-2">Persons</h1>
              <p className="text-muted-foreground">Manage person profiles</p>
            </div>
            <button
              onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', email: '', notes: '', conditions: [], assigned_frequencies: [] }); }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 font-medium"
            >
              <Plus className="w-5 h-5" />
              New Person
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {persons.map((person) => (
              <div key={person.id} className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-heading font-semibold text-white">{person.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleManageSequences(person)}
                      className="text-muted-foreground hover:text-primary"
                      title="Manage sequences"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(person)} className="text-muted-foreground hover:text-white">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(person.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {person.email && (
                  <p className="text-sm text-muted-foreground mb-2">{person.email}</p>
                )}
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    <span className="text-accent font-medium">{person.assigned_frequencies?.length || 0}</span> frequencies
                  </p>
                  <p className="text-muted-foreground">
                    <span className="text-primary font-medium">{person.assigned_sequences?.length || 0}</span> sequences
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sequences: {getAssignedSequencesNames(person)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Create/Edit Person Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">{editingId ? 'Edit' : 'New'} Person</h2>
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
                <label className="block text-sm font-medium text-foreground mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg p-4 text-white resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Sequences Modal */}
      {showSequencesModal && selectedPerson && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSequencesModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">
              Manage Sequences
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Person: <span className="text-white font-medium">{selectedPerson.name}</span>
            </p>

            <button
              onClick={handleCreateNewSequence}
              className="w-full mb-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Create New Sequence
            </button>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sequences.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No sequences available</p>
              ) : (
                sequences.map((seq) => {
                  const isAssigned = selectedPerson.assigned_sequences?.includes(seq.id);
                  return (
                    <label
                      key={seq.id}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => toggleSequenceAssignment(seq.id)}
                        className="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">{seq.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {seq.frequencies.length} frequencies • {seq.frequencies.reduce((sum, f) => sum + f.duration, 0)}s
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setShowSequencesModal(false)}
              className="w-full mt-6 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create New Sequence Modal */}
      {showNewSequenceModal && selectedPerson && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNewSequenceModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-2">Create New Sequence</h2>
            <p className="text-sm text-muted-foreground mb-6">
              For: <span className="text-white font-medium">{selectedPerson.name}</span>
            </p>

            <form onSubmit={handleSubmitNewSequence} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sequence Name</label>
                <input
                  type="text"
                  value={newSeqName}
                  onChange={(e) => setNewSeqName(e.target.value)}
                  required
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-foreground">Frequencies</label>
                  <button type="button" onClick={addFreqToNewSeq} className="text-sm text-primary hover:text-primary/80">
                    + Add Frequency
                  </button>
                </div>

                <div className="space-y-3">
                  {newSeqFreqs.map((freq, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Frequency {idx + 1}</span>
                        <button type="button" onClick={() => removeFreqFromNewSeq(idx)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Hz</label>
                          <input
                            type="number"
                            value={freq.hz || ''}
                            onChange={(e) => updateNewSeqFreq(idx, 'hz', parseFloat(e.target.value))}
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
                            onChange={(e) => updateNewSeqFreq(idx, 'duration', parseInt(e.target.value))}
                            min="1"
                            required
                            className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-10 px-3 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Color</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={freq.color || '#FFFFFF'}
                            onChange={(e) => updateNewSeqFreq(idx, 'color', e.target.value)}
                            className="h-10 w-16 bg-black/20 border border-white/10 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={freq.color || '#FFFFFF'}
                            onChange={(e) => updateNewSeqFreq(idx, 'color', e.target.value)}
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
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium">
                  Create & Assign
                </button>
                <button type="button" onClick={() => setShowNewSequenceModal(false)} className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
