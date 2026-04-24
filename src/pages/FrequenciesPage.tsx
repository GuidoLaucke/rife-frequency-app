/**
 * FrequenciesPage v2.0 - With Search, Sort & Filters
 * File: FrequenciesPage-v2.0-search-sort-20250424.tsx
 * Date: 2025-04-24
 * 
 * CHANGES v2.0:
 * - Added: Search field (live search by name, description, hz)
 * - Added: Sorting (Hz asc/desc, Name A-Z/Z-A)
 * - Added: Frequency range filters (0-10, 10-100, 100-1000, 1000+)
 * - Combined filter logic (search + range + sort)
 * 
 * DEPENDENCIES:
 * - db.ts v3.0+
 * - react-i18next
 * - react-router-dom
 */

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { AssignmentModal } from '@/components/assignment/AssignmentModal';
import { QuickCreateModal } from '@/components/assignment/QuickCreateModal';
import { useNavigate } from 'react-router-dom';
import { getFrequencies, createFrequency, updateFrequency, deleteFrequency, type Frequency } from '@/lib/db';
import { Plus, Trash2, Edit, Link as LinkIcon, Play, Search, X, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type SortOption = 'hz-asc' | 'hz-desc' | 'name-asc' | 'name-desc';
type FrequencyRange = 'all' | '0-10' | '10-100' | '100-1000' | '1000+';

export function FrequenciesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFrequency, setEditingFrequency] = useState<Frequency | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    hz: '',
    description: '',
    color: '#8B5CF6',
  });

  // NEW: Search, Sort & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('hz-asc');
  const [selectedRange, setSelectedRange] = useState<FrequencyRange>('all');

  // Assignment modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assigningFrequency, setAssigningFrequency] = useState<{ id: number; name: string } | null>(null);
  
  // Quick create modal state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<'sequence' | 'person' | 'condition'>('person');

  useEffect(() => {
    loadFrequencies();
  }, []);

  const loadFrequencies = async () => {
    const data = await getFrequencies();
    setFrequencies(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hz = Number(formData.hz);
    if (isNaN(hz) || hz < 1 || hz > 20000) {
      toast.error(t('frequencies.invalidHz'));
      return;
    }

    try {
      const frequencyData = {
        name: formData.name,
        hz,
        description: formData.description,
        color: formData.color,
        isPredefined: false,
        updatedAt: new Date(),
      };

      let newId: number;

      if (editingFrequency) {
        await updateFrequency(editingFrequency.id!, frequencyData);
        toast.success(t('frequencies.updated'));
      } else {
        newId = await createFrequency({
          ...frequencyData,
          createdAt: new Date(),
        });
        toast.success(t('frequencies.created'));
        
        const shouldAssign = confirm('Möchtest du diese Frequenz jetzt zuordnen?');
        if (shouldAssign && newId) {
          const freq = await getFrequencies();
          const created = freq.find(f => f.id === newId);
          if (created) {
            setAssigningFrequency({ id: newId, name: created.name });
            setShowAssignmentModal(true);
          }
        }
      }

      setShowModal(false);
      setEditingFrequency(null);
      setFormData({ name: '', hz: '', description: '', color: '#8B5CF6' });
      loadFrequencies();
    } catch (error) {
      toast.error('Error saving frequency');
    }
  };

  const handleEdit = (frequency: Frequency) => {
    setEditingFrequency(frequency);
    setFormData({
      name: frequency.name,
      hz: String(frequency.hz),
      description: frequency.description || '',
      color: frequency.color,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, isPredefined: boolean) => {
    if (isPredefined) {
      toast.error(t('frequencies.deleteError'));
      return;
    }
    
    if (!confirm(t('common.delete') + '?')) return;
    
    try {
      await deleteFrequency(id);
      toast.success(t('frequencies.deleted'));
      loadFrequencies();
    } catch (error) {
      toast.error('Error deleting frequency');
    }
  };

  const handleAssign = (frequency: Frequency) => {
    setAssigningFrequency({ id: frequency.id!, name: frequency.name });
    setShowAssignmentModal(true);
  };

  const handlePlayFrequency = (frequency: Frequency) => {
    navigate(`/player?frequency=${frequency.id}`);
  };

  const handleQuickCreate = (type: 'frequency' | 'sequence' | 'person' | 'condition') => {
    if (type !== 'frequency') {
      setQuickCreateType(type as any);
      setShowQuickCreate(true);
    }
  };

  const handleQuickCreated = async (newId: number) => {
    setShowQuickCreate(false);
    if (assigningFrequency) {
      setShowAssignmentModal(false);
      setTimeout(() => setShowAssignmentModal(true), 100);
    }
  };

  // NEW: Filter + Sort Logic
  const filteredAndSortedFrequencies = frequencies
    .filter(freq => {
      // Range filter
      if (selectedRange !== 'all') {
        const hz = freq.hz;
        switch (selectedRange) {
          case '0-10':
            if (hz > 10) return false;
            break;
          case '10-100':
            if (hz < 10 || hz > 100) return false;
            break;
          case '100-1000':
            if (hz < 100 || hz > 1000) return false;
            break;
          case '1000+':
            if (hz < 1000) return false;
            break;
        }
      }

      // Search filter
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const matchesName = freq.name.toLowerCase().includes(query);
      const matchesDescription = freq.description?.toLowerCase().includes(query) || false;
      const matchesHz = String(freq.hz).includes(query);

      return matchesName || matchesDescription || matchesHz;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'hz-asc':
          return a.hz - b.hz;
        case 'hz-desc':
          return b.hz - a.hz;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
                {t('frequencies.title')}
              </h1>
              <p className="text-muted-foreground">{t('frequencies.subtitle')}</p>
            </div>
            <button
              onClick={() => {
                setEditingFrequency(null);
                setFormData({ name: '', hz: '', description: '', color: '#8B5CF6' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-3 font-medium"
            >
              <Plus className="w-5 h-5" />
              {t('frequencies.new')}
            </button>
          </div>

          {/* Search Field */}
          <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search') + '...'}
                className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg h-12 pl-12 pr-4 text-white placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filters & Sort */}
          <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Frequency Range Filter */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <span>Frequenzbereich</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedRange('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedRange === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    Alle
                  </button>
                  <button
                    onClick={() => setSelectedRange('0-10')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedRange === '0-10'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    0-10 Hz
                  </button>
                  <button
                    onClick={() => setSelectedRange('10-100')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedRange === '10-100'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    10-100 Hz
                  </button>
                  <button
                    onClick={() => setSelectedRange('100-1000')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedRange === '100-1000'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    100-1000 Hz
                  </button>
                  <button
                    onClick={() => setSelectedRange('1000+')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedRange === '1000+'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    1000+ Hz
                  </button>
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Sortierung</span>
                </h3>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                >
                  <option value="hz-asc">Hz aufsteigend (niedrig → hoch)</option>
                  <option value="hz-desc">Hz absteigend (hoch → niedrig)</option>
                  <option value="name-asc">Name A → Z</option>
                  <option value="name-desc">Name Z → A</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-muted-foreground text-sm">
                {filteredAndSortedFrequencies.length} {filteredAndSortedFrequencies.length === 1 ? 'Frequenz' : 'Frequenzen'} gefunden
              </p>
            </div>
          </div>

          {/* Frequencies Grid */}
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedFrequencies.map((frequency) => (
              <div
                key={frequency.id}
                className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: frequency.color }}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-heading font-bold text-white mb-1">
                        {frequency.name}
                      </h3>
                      <p className="text-primary font-mono text-lg">{frequency.hz} Hz</p>
                    </div>
                  </div>
                </div>

                {frequency.description && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {frequency.description}
                  </p>
                )}

                {frequency.isPredefined && (
                  <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm rounded-full mb-4">
                    {t('frequencies.predefined')}
                  </span>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePlayFrequency(frequency)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    title="Abspielen"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleAssign(frequency)}
                    className="flex-1 flex items-center justify-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    title="Zuordnen"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleEdit(frequency)}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!frequency.isPredefined && (
                    <button
                      onClick={() => handleDelete(frequency.id!, frequency.isPredefined)}
                      className="flex items-center justify-center gap-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedFrequencies.length === 0 && (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-12 text-center">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-heading font-bold text-white mb-2">
                Keine Frequenzen gefunden
              </h3>
              <p className="text-muted-foreground">
                Versuche andere Suchbegriffe oder Filter
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-white">
                {editingFrequency ? t('frequencies.edit') : t('frequencies.new')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-white"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            {editingFrequency?.isPredefined && (
              <div className="mb-4 p-3 bg-primary/20 border border-primary/30 rounded-lg">
                <p className="text-primary text-sm">{t('frequencies.colorNote')}</p>
              </div>
            )}

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
                  disabled={editingFrequency?.isPredefined}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('frequencies.hz')}
                </label>
                <input
                  type="number"
                  value={formData.hz}
                  onChange={(e) => setFormData({ ...formData, hz: e.target.value })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                  disabled={editingFrequency?.isPredefined}
                  min="1"
                  max="20000"
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
                  disabled={editingFrequency?.isPredefined}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('common.color')}
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-11 rounded-lg"
                />
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

      {/* Assignment Modal */}
      {assigningFrequency && (
        <AssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setAssigningFrequency(null);
          }}
          entityType="frequency"
          entityId={assigningFrequency.id}
          entityName={assigningFrequency.name}
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
