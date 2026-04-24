import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { AssignmentModal } from '@/components/assignment/AssignmentModal';
import { QuickCreateModal } from '@/components/assignment/QuickCreateModal';
import { useNavigate } from 'react-router-dom';
import {
  getSequences,
  createSequence,
  updateSequence,
  deleteSequence,
  getFrequencies,
  type Sequence,
  type Frequency,
} from '@/lib/db';
import { Plus, Trash2, Edit, ListOrdered, Link as LinkIcon, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function SequencesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedFrequencies: [] as { frequencyId: number; duration: number }[],
  });

  // Assignment modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assigningSequence, setAssigningSequence] = useState<{ id: number; name: string } | null>(null);
  
  // Quick create modal state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<'frequency' | 'person' | 'condition'>('frequency');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [seqs, freqs] = await Promise.all([
      getSequences(),
      getFrequencies(),
    ]);
    setSequences(seqs);
    setFrequencies(freqs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.selectedFrequencies.length === 0) {
      toast.error('Bitte mindestens eine Frequenz hinzufügen');
      return;
    }

    try {
      const sequenceData = {
        name: formData.name,
        description: formData.description,
        frequencies: formData.selectedFrequencies,
        updatedAt: new Date(),
      };

      let newId: number;

      if (editingSequence) {
        await updateSequence(editingSequence.id!, sequenceData);
        toast.success('Sequenz aktualisiert');
      } else {
        newId = await createSequence({
          ...sequenceData,
          createdAt: new Date(),
        });
        toast.success('Sequenz erstellt');
        
        const shouldAssign = confirm('Möchtest du diese Sequenz jetzt zuordnen?');
        if (shouldAssign && newId) {
          const seqs = await getSequences();
          const created = seqs.find(s => s.id === newId);
          if (created) {
            setAssigningSequence({ id: newId, name: created.name });
            setShowAssignmentModal(true);
          }
        }
      }

      setShowModal(false);
      setEditingSequence(null);
      setFormData({ name: '', description: '', selectedFrequencies: [] });
      loadData();
    } catch (error) {
      toast.error('Error saving sequence');
    }
  };

  const handleEdit = (sequence: Sequence) => {
    setEditingSequence(sequence);
    setFormData({
      name: sequence.name,
      description: sequence.description || '',
      selectedFrequencies: sequence.frequencies || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sequenz löschen?')) return;

    try {
      await deleteSequence(id);
      toast.success('Sequenz gelöscht');
      loadData();
    } catch (error) {
      toast.error('Error deleting sequence');
    }
  };

  const handleAddFrequency = (frequencyId: number) => {
    if (formData.selectedFrequencies.some(f => f.frequencyId === frequencyId)) {
      toast.error('Frequenz bereits hinzugefügt');
      return;
    }

    setFormData({
      ...formData,
      selectedFrequencies: [
        ...formData.selectedFrequencies,
        { frequencyId, duration: 60 },
      ],
    });
  };

  const handleRemoveFrequency = (frequencyId: number) => {
    setFormData({
      ...formData,
      selectedFrequencies: formData.selectedFrequencies.filter(
        f => f.frequencyId !== frequencyId
      ),
    });
  };

  const handleDurationChange = (frequencyId: number, duration: number) => {
    setFormData({
      ...formData,
      selectedFrequencies: formData.selectedFrequencies.map(f =>
        f.frequencyId === frequencyId ? { ...f, duration } : f
      ),
    });
  };

  const handleAssign = (sequence: Sequence) => {
    setAssigningSequence({ id: sequence.id!, name: sequence.name });
    setShowAssignmentModal(true);
  };

  // NEW: Navigate to player with sequence pre-selected
  const handlePlaySequence = (sequence: Sequence) => {
    navigate(`/player?sequence=${sequence.id}`);
  };

  const handleQuickCreate = (type: 'frequency' | 'sequence' | 'person' | 'condition') => {
    if (type !== 'sequence') {
      setQuickCreateType(type as any);
      setShowQuickCreate(true);
    }
  };

  const handleQuickCreated = async (newId: number) => {
    setShowQuickCreate(false);
    if (quickCreateType === 'frequency') {
      await loadData();
    }
    if (assigningSequence) {
      setShowAssignmentModal(false);
      setTimeout(() => setShowAssignmentModal(true), 100);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
                {t('sequences.title')}
              </h1>
              <p className="text-muted-foreground">{t('sequences.subtitle')}</p>
            </div>
            <button
              onClick={() => {
                setEditingSequence(null);
                setFormData({ name: '', description: '', selectedFrequencies: [] });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-3 font-medium"
            >
              <Plus className="w-5 h-5" />
              {t('sequences.new')}
            </button>
          </div>

          {/* Sequences Grid */}
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {sequences.map((sequence) => (
              <div
                key={sequence.id}
                className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <ListOrdered className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-heading font-bold text-white mb-1 truncate">
                      {sequence.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {sequence.frequencies?.length || 0} Frequenzen
                    </p>
                  </div>
                </div>

                {sequence.description && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {sequence.description}
                  </p>
                )}

                {/* Frequency List */}
                {sequence.frequencies && sequence.frequencies.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {sequence.frequencies.slice(0, 3).map((freq, index) => {
                      const frequency = frequencies.find(f => f.id === freq.frequencyId);
                      return frequency ? (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: frequency.color }}
                          />
                          <span className="text-white truncate">{frequency.name}</span>
                          <span className="text-muted-foreground text-xs ml-auto">
                            {freq.duration}s
                          </span>
                        </div>
                      ) : null;
                    })}
                    {sequence.frequencies.length > 3 && (
                      <p className="text-muted-foreground text-xs">
                        +{sequence.frequencies.length - 3} weitere
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* NEW: Player Button */}
                  <button
                    onClick={() => handlePlaySequence(sequence)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    title="Abspielen"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleAssign(sequence)}
                    className="flex-1 flex items-center justify-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    title="Zuordnen"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleEdit(sequence)}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(sequence.id!)}
                    className="flex items-center justify-center gap-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal - same as v1.1 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-white">
                {editingSequence ? 'Sequenz bearbeiten' : 'Neue Sequenz'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-white"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Beschreibung (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg p-4 text-white min-h-[80px]"
                  rows={2}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-white">Frequenzen wählen</label>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickCreateType('frequency');
                      setShowQuickCreate(true);
                    }}
                    className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Neue Frequenz
                  </button>
                </div>
                
                <div className="space-y-2 mb-4">
                  {formData.selectedFrequencies.map((selectedFreq, index) => {
                    const frequency = frequencies.find(f => f.id === selectedFreq.frequencyId);
                    return frequency ? (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: frequency.color }} />
                        <span className="text-white flex-1">{frequency.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={selectedFreq.duration}
                            onChange={(e) => handleDurationChange(selectedFreq.frequencyId, Number(e.target.value))}
                            className="w-20 bg-black/20 border-white/10 rounded px-2 py-1 text-white text-sm text-center"
                            min="1"
                          />
                          <span className="text-muted-foreground text-sm">Sek</span>
                        </div>
                        <button type="button" onClick={() => handleRemoveFrequency(selectedFreq.frequencyId)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null;
                  })}
                  {formData.selectedFrequencies.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">Noch keine Frequenzen ausgewählt</p>
                  )}
                </div>

                <div className="border border-white/10 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <p className="text-sm font-medium text-white mb-3">Verfügbare Frequenzen</p>
                  <div className="space-y-2">
                    {frequencies.filter(f => !formData.selectedFrequencies.some(sf => sf.frequencyId === f.id)).map(frequency => (
                      <button
                        key={frequency.id}
                        type="button"
                        onClick={() => handleAddFrequency(frequency.id!)}
                        className="w-full flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-all"
                      >
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: frequency.color }} />
                        <span className="text-white flex-1">{frequency.name}</span>
                        <span className="text-primary font-mono text-sm">{frequency.hz} Hz</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium">Speichern</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2">Abbrechen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {assigningSequence && (
        <AssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setAssigningSequence(null);
          }}
          entityType="sequence"
          entityId={assigningSequence.id}
          entityName={assigningSequence.name}
          onQuickCreate={handleQuickCreate}
        />
      )}

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        entityType={quickCreateType}
        onCreated={handleQuickCreated}
      />
    </div>
  );
}
