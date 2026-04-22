import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { 
  getConditions, 
  createCondition, 
  updateCondition, 
  deleteCondition,
  getCategories,
  getFrequencies,
  getSequences,
  assignFrequencyToCondition,
  removeFrequencyFromCondition,
  assignSequenceToCondition,
  removeSequenceFromCondition,
  getFrequenciesForCondition,
  getSequencesForCondition,
  type Condition,
  type Category,
  type Frequency,
  type Sequence
} from '@/lib/db';
import { Plus, Edit, Trash2, X, Radio, List } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function ConditionsPage() {
  const { t } = useTranslation();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCondition, setEditingCondition] = useState<Condition | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: 0,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  
  // Frequency/Sequence assignment modals
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [availableFrequencies, setAvailableFrequencies] = useState<Frequency[]>([]);
  const [availableSequences, setAvailableSequences] = useState<Sequence[]>([]);
  const [assignedFrequencies, setAssignedFrequencies] = useState<Frequency[]>([]);
  const [assignedSequences, setAssignedSequences] = useState<Sequence[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [conditionsData, categoriesData] = await Promise.all([
      getConditions(),
      getCategories(),
    ]);
    setConditions(conditionsData);
    setCategories(categoriesData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.categoryId) {
      toast.error(t('common.required'));
      return;
    }

    try {
      const conditionData = {
        ...formData,
        updatedAt: new Date(),
      };

      if (editingCondition) {
        await updateCondition(editingCondition.id!, conditionData);
        toast.success(t('conditions.updated'));
      } else {
        await createCondition({
          ...conditionData,
          createdAt: new Date(),
        });
        toast.success(t('conditions.created'));
      }

      setShowModal(false);
      setEditingCondition(null);
      setFormData({ name: '', description: '', categoryId: 0, tags: [] });
      loadData();
    } catch (error) {
      toast.error('Error saving condition');
    }
  };

  const handleEdit = (condition: Condition) => {
    setEditingCondition(condition);
    setFormData({
      name: condition.name,
      description: condition.description || '',
      categoryId: condition.categoryId,
      tags: condition.tags || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('conditions.deleteConfirm'))) return;
    
    try {
      await deleteCondition(id);
      toast.success(t('conditions.deleted'));
      loadData();
    } catch (error) {
      toast.error('Error deleting condition');
    }
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? t(`category.${category.key}`) : '';
  };

  // ========================================
  // FREQUENCY ASSIGNMENT
  // ========================================

  const openFrequencyModal = async (condition: Condition) => {
    setSelectedCondition(condition);
    const [allFreqs, assigned] = await Promise.all([
      getFrequencies(),
      getFrequenciesForCondition(condition.id!),
    ]);
    setAvailableFrequencies(allFreqs);
    setAssignedFrequencies(assigned);
    setShowFrequencyModal(true);
  };

  const handleFrequencyToggle = async (frequency: Frequency) => {
    if (!selectedCondition) return;

    const isAssigned = assignedFrequencies.some(f => f.id === frequency.id);

    try {
      if (isAssigned) {
        await removeFrequencyFromCondition(selectedCondition.id!, frequency.id!);
        setAssignedFrequencies(assignedFrequencies.filter(f => f.id !== frequency.id));
        toast.success(t('persons.frequencyRemoved'));
      } else {
        await assignFrequencyToCondition(selectedCondition.id!, frequency.id!);
        setAssignedFrequencies([...assignedFrequencies, frequency]);
        toast.success(t('persons.frequencyAssigned'));
      }
    } catch (error) {
      toast.error('Error updating frequency assignment');
    }
  };

  // ========================================
  // SEQUENCE ASSIGNMENT
  // ========================================

  const openSequenceModal = async (condition: Condition) => {
    setSelectedCondition(condition);
    const [allSeqs, assigned] = await Promise.all([
      getSequences(),
      getSequencesForCondition(condition.id!),
    ]);
    setAvailableSequences(allSeqs);
    setAssignedSequences(assigned);
    setShowSequenceModal(true);
  };

  const handleSequenceToggle = async (sequence: Sequence) => {
    if (!selectedCondition) return;

    const isAssigned = assignedSequences.some(s => s.id === sequence.id);

    try {
      if (isAssigned) {
        await removeSequenceFromCondition(selectedCondition.id!, sequence.id!);
        setAssignedSequences(assignedSequences.filter(s => s.id !== sequence.id));
        toast.success(t('persons.sequenceRemoved'));
      } else {
        await assignSequenceToCondition(selectedCondition.id!, sequence.id!);
        setAssignedSequences([...assignedSequences, sequence]);
        toast.success(t('persons.sequenceAssigned'));
      }
    } catch (error) {
      toast.error('Error updating sequence assignment');
    }
  };

  // ========================================
  // GET COUNTS FOR DISPLAY
  // ========================================

  const [conditionCounts, setConditionCounts] = useState<Record<number, { frequencies: number; sequences: number }>>({});

  useEffect(() => {
    const loadCounts = async () => {
      const counts: Record<number, { frequencies: number; sequences: number }> = {};
      for (const condition of conditions) {
        if (condition.id) {
          const [freqs, seqs] = await Promise.all([
            getFrequenciesForCondition(condition.id),
            getSequencesForCondition(condition.id),
          ]);
          counts[condition.id] = {
            frequencies: freqs.length,
            sequences: seqs.length,
          };
        }
      }
      setConditionCounts(counts);
    };
    if (conditions.length > 0) {
      loadCounts();
    }
  }, [conditions]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
                {t('conditions.title')}
              </h1>
              <p className="text-muted-foreground">{t('conditions.subtitle')}</p>
            </div>
            <button
              onClick={() => {
                setEditingCondition(null);
                setFormData({ name: '', description: '', categoryId: 0, tags: [] });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-3 font-medium"
            >
              <Plus className="w-5 h-5" />
              {t('conditions.new')}
            </button>
          </div>

          {conditions.length === 0 ? (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t('conditions.noConditions')}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-heading font-bold text-white mb-2">
                        {condition.name}
                      </h3>
                      {condition.description && (
                        <p className="text-muted-foreground text-sm mb-3">
                          {condition.description}
                        </p>
                      )}
                      <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">
                        {getCategoryName(condition.categoryId)}
                      </span>
                    </div>
                  </div>

                  {condition.tags && condition.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {condition.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-white/10 text-white text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Frequency & Sequence Counts */}
                  <div className="flex gap-2 mb-4 text-sm text-muted-foreground">
                    <span>🎵 {conditionCounts[condition.id!]?.frequencies || 0}</span>
                    <span>📋 {conditionCounts[condition.id!]?.sequences || 0}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openFrequencyModal(condition)}
                      className="flex-1 flex items-center justify-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                      title={t('persons.manageFrequencies')}
                    >
                      <Radio className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openSequenceModal(condition)}
                      className="flex-1 flex items-center justify-center gap-2 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                      title={t('persons.manageSequences')}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(condition)}
                      className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(condition.id!)}
                      className="flex items-center justify-center gap-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-white">
                {editingCondition ? t('conditions.edit') : t('conditions.new')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('common.name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('common.description')} ({t('common.optional')})
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg p-4 text-white min-h-[100px]"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('conditions.category')}
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                  required
                >
                  <option value={0}>{t('conditions.selectCategory')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {t(`category.${category.key}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('common.tags')} ({t('common.optional')})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder={t('conditions.tagPlaceholder')}
                    className="flex-1 bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2"
                  >
                    {t('conditions.addTag')}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('conditions.tagExamples')}
                </p>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-2 px-3 py-1 bg-white/10 text-white rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium"
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FREQUENCY ASSIGNMENT MODAL */}
      {showFrequencyModal && selectedCondition && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-white">
                {t('persons.manageFrequencies')}
              </h2>
              <button
                onClick={() => setShowFrequencyModal(false)}
                className="text-muted-foreground hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-muted-foreground mb-6">
              {selectedCondition.name}
            </p>

            {availableFrequencies.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('persons.noFrequenciesAvailable')}
              </p>
            ) : (
              <div className="space-y-2">
                {availableFrequencies.map((frequency) => {
                  const isAssigned = assignedFrequencies.some(f => f.id === frequency.id);
                  return (
                    <label
                      key={frequency.id}
                      className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => handleFrequencyToggle(frequency)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: frequency.color }}
                          />
                          <span className="text-white font-medium">{frequency.name}</span>
                          <span className="text-primary font-mono">{frequency.hz} Hz</span>
                        </div>
                        {frequency.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {frequency.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setShowFrequencyModal(false)}
              className="w-full mt-6 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-3 font-medium"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* SEQUENCE ASSIGNMENT MODAL */}
      {showSequenceModal && selectedCondition && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-white">
                {t('persons.manageSequences')}
              </h2>
              <button
                onClick={() => setShowSequenceModal(false)}
                className="text-muted-foreground hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-muted-foreground mb-6">
              {selectedCondition.name}
            </p>

            {availableSequences.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('persons.noSequencesAvailable')}
              </p>
            ) : (
              <div className="space-y-2">
                {availableSequences.map((sequence) => {
                  const isAssigned = assignedSequences.some(s => s.id === sequence.id);
                  const duration = sequence.frequencies?.reduce((sum, f) => sum + f.duration, 0) || 0;
                  return (
                    <label
                      key={sequence.id}
                      className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => handleSequenceToggle(sequence)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">{sequence.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {sequence.frequencies?.length || 0} {t('player.frequenciesCount', { count: sequence.frequencies?.length || 0 })} • {duration}s
                          </span>
                        </div>
                        {sequence.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {sequence.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setShowSequenceModal(false)}
              className="w-full mt-6 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-3 font-medium"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
