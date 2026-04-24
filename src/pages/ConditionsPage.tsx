/**
 * ConditionsPage v1.3 - With Player Button & Button Labels
 * File: ConditionsPage-v1.3-player-20250424.tsx
 * Date: 2025-04-24
 * 
 * CHANGES v1.3:
 * - Added: Player button to start condition in PlayerPage
 * - Added: Button text labels (Player, Edit, Delete)
 * - Fixed: Navigate to player with condition frequencies
 * 
 * CHANGES v1.2:
 * - Fixed: "Alle" button now uses t('conditions.all')
 * - Fixed: "Neues Anwendungsgebiet" uses t('conditions.new')
 * - Fixed: All hardcoded German text replaced with i18n keys
 * - Works properly with Russian/German/English/Italian
 * 
 * DEPENDENCIES:
 * - db.ts v3.0+
 * - react-i18next
 * - react-router-dom
 * - AssignmentModal
 * - QuickCreateModal
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { AssignmentModal } from '@/components/assignment/AssignmentModal';
import { QuickCreateModal } from '@/components/assignment/QuickCreateModal';
import {
  getConditions,
  createCondition,
  updateCondition,
  deleteCondition,
  getCategories,
  type Condition,
  type Category,
} from '@/lib/db';
import { Plus, Edit, Trash2, X, Radio, FileText, Link as LinkIcon, Play, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function ConditionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCondition, setEditingCondition] = useState<Condition | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: 1,
    tags: [] as string[],
    tagInput: '',
  });

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assigningCondition, setAssigningCondition] = useState<{ id: number; name: string } | null>(null);
  
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<'frequency' | 'sequence' | 'person'>('frequency');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [conds, cats] = await Promise.all([
      getConditions(),
      getCategories(),
    ]);
    setConditions(conds);
    setCategories(cats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const conditionData = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        tags: formData.tags,
        updatedAt: new Date(),
      };

      let newId: number;

      if (editingCondition) {
        await updateCondition(editingCondition.id!, conditionData);
        toast.success(t('conditions.updated'));
      } else {
        newId = await createCondition({
          ...conditionData,
          createdAt: new Date(),
        });
        toast.success(t('conditions.created'));
        
        const shouldAssign = confirm(t('conditions.assignPrompt'));
        if (shouldAssign && newId) {
          const conds = await getConditions();
          const created = conds.find(c => c.id === newId);
          if (created) {
            setAssigningCondition({ id: newId, name: created.name });
            setShowAssignmentModal(true);
          }
        }
      }

      setShowModal(false);
      setEditingCondition(null);
      setFormData({ name: '', description: '', categoryId: 1, tags: [], tagInput: '' });
      loadData();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEdit = (condition: Condition) => {
    setEditingCondition(condition);
    setFormData({
      name: condition.name,
      description: condition.description || '',
      categoryId: condition.categoryId,
      tags: condition.tags || [],
      tagInput: '',
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
      toast.error(t('common.error'));
    }
  };

  const handlePlayCondition = (condition: Condition) => {
    // Navigate to player with condition frequencies
    navigate('/player', { 
      state: { 
        conditionId: condition.id,
        conditionName: condition.name,
        frequencies: condition.frequencies || []
      } 
    });
  };

  const handleAddTag = () => {
    const tag = formData.tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
        tagInput: '',
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const handleAssign = (condition: Condition) => {
    setAssigningCondition({ id: condition.id!, name: condition.name });
    setShowAssignmentModal(true);
  };

  const handleQuickCreate = (type: 'frequency' | 'sequence' | 'person' | 'condition') => {
    if (type !== 'condition') {
      setQuickCreateType(type as any);
      setShowQuickCreate(true);
    }
  };

  const handleQuickCreated = async (newId: number) => {
    setShowQuickCreate(false);
    if (assigningCondition) {
      setShowAssignmentModal(false);
      setTimeout(() => setShowAssignmentModal(true), 100);
    }
  };

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  const handleNewCondition = () => {
    setEditingCondition(null);
    const preselectedCategoryId = selectedCategory || 1;
    setFormData({ 
      name: '', 
      description: '', 
      categoryId: preselectedCategoryId, 
      tags: [], 
      tagInput: '' 
    });
    setShowModal(true);
  };

  // Helper to get correct i18n key for category
  const getCategoryI18nKey = (categoryKey: string): string => {
    const keyMap: Record<string, string> = {
      'physical': 'physical_health',
      'mental': 'mental_health',
      'spiritual': 'spiritual',
      'physical_health': 'physical_health',
      'mental_health': 'mental_health',
    };
    return `category.${keyMap[categoryKey] || categoryKey}`;
  };

  const filteredConditions = conditions.filter(condition => {
    // Category filter
    const matchesCategory = selectedCategory === null || condition.categoryId === selectedCategory;
    
    // Search filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;
    
    const matchesName = condition.name.toLowerCase().includes(query);
    const matchesDescription = condition.description?.toLowerCase().includes(query) || false;
    const matchesTags = condition.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
    
    return matchesCategory && (matchesName || matchesDescription || matchesTags);
  });

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
              onClick={handleNewCondition}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-3 font-medium"
            >
              <Plus className="w-5 h-5" />
              {t('conditions.new')}
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

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              {t('conditions.all')}
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id!)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                }`}
              >
                {t(getCategoryI18nKey(category.key))}
              </button>
            ))}
          </div>

          {/* Conditions Grid */}
          {filteredConditions.length === 0 ? (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-heading font-bold text-white mb-2">
                {t('conditions.empty')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('conditions.emptyDesc')}
              </p>
              <button
                onClick={handleNewCondition}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-3 font-medium"
              >
                <Plus className="w-5 h-5" />
                {t('conditions.new')}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredConditions.map((condition) => {
                const category = categories.find(c => c.id === condition.categoryId);
                return (
                  <div
                    key={condition.id}
                    className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Radio className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-heading font-bold text-white mb-1 truncate">
                          {condition.name}
                        </h3>
                        {category && (
                          <span className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                            {t(getCategoryI18nKey(category.key))}
                          </span>
                        )}
                      </div>
                    </div>

                    {condition.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {condition.description}
                      </p>
                    )}

                    {condition.tags && condition.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {condition.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white/10 text-white text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {/* Player Button - FULL WIDTH */}
                      <button
                        onClick={() => handlePlayCondition(condition)}
                        className="col-span-2 flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                        title={t('player.title')}
                      >
                        <Play className="w-4 h-4" />
                        {t('player.title')}
                      </button>

                      {/* Assign Button - WITH TEXT */}
                      <button
                        onClick={() => handleAssign(condition)}
                        className="flex items-center justify-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                        title={t('common.assign')}
                      >
                        <LinkIcon className="w-4 h-4" />
                        <span className="hidden md:inline">{t('common.assign')}</span>
                      </button>
                      
                      {/* Edit Button - WITH TEXT */}
                      <button
                        onClick={() => handleEdit(condition)}
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                        title={t('common.edit')}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden md:inline">{t('common.edit')}</span>
                      </button>
                      
                      {/* Delete Button - FULL WIDTH WITH TEXT */}
                      <button
                        onClick={() => handleDelete(condition.id!)}
                        className="col-span-2 flex items-center justify-center gap-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
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
                  {t('conditions.category')}
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {t(getCategoryI18nKey(category.key))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('common.description')} ({t('common.optional')})
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg p-4 text-white min-h-[80px]"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('conditions.tags')} ({t('common.optional')})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.tagInput}
                    onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-10 px-4 text-white"
                    placeholder={t('conditions.addTag')}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="bg-primary/20 hover:bg-primary/30 text-primary rounded-lg px-4 h-10"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 text-white text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
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

      {assigningCondition && (
        <AssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setAssigningCondition(null);
          }}
          entityType="condition"
          entityId={assigningCondition.id}
          entityName={assigningCondition.name}
          onQuickCreate={handleQuickCreate}
        />
      )}

      <QuickCreateModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        entityType={quickCreateType}
        onCreated={handleQuickCreated}
      />
    </div>
  );
}
