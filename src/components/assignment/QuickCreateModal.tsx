/**
 * QuickCreateModal - Quick entity creation
 * Version: 1.0
 * 
 * Allows quick creation of:
 * - Frequencies
 * - Sequences  
 * - Persons
 * - Conditions
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  createFrequency,
  createSequence,
  createPerson,
  createCondition,
  getCategories,
  type Category,
} from '@/lib/db';
import { toast } from 'sonner';

type EntityType = 'frequency' | 'sequence' | 'person' | 'condition';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  onCreated: (id: number) => void;
}

export function QuickCreateModal({
  isOpen,
  onClose,
  entityType,
  onCreated,
}: QuickCreateModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<any>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useState(() => {
    if (entityType === 'condition') {
      getCategories().then(setCategories);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let newId: number;

      switch (entityType) {
        case 'frequency':
          newId = await createFrequency({
            name: formData.name || '',
            hz: Number(formData.hz) || 0,
            description: formData.description || '',
            color: formData.color || '#8B5CF6',
            isPredefined: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          toast.success(t('frequencies.created'));
          break;

        case 'sequence':
          newId = await createSequence({
            name: formData.name || '',
            description: formData.description || '',
            frequencies: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          toast.success(t('sequences.created'));
          break;

        case 'person':
          newId = await createPerson({
            name: formData.name || '',
            email: formData.email || '',
            notes: formData.notes || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          toast.success(t('persons.created'));
          break;

        case 'condition':
          newId = await createCondition({
            name: formData.name || '',
            description: formData.description || '',
            categoryId: Number(formData.categoryId) || 1,
            tags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          toast.success(t('conditions.created'));
          break;

        default:
          throw new Error('Unknown entity type');
      }

      onCreated(newId);
      setFormData({});
      onClose();
    } catch (error) {
      toast.error('Error creating item');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold text-white">
            {entityType === 'frequency' && 'Neue Frequenz'}
            {entityType === 'sequence' && 'Neue Sequenz'}
            {entityType === 'person' && 'Neue Person'}
            {entityType === 'condition' && 'Neues Anwendungsgebiet'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field (all types) */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('common.name')}
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
              required
              autoFocus
            />
          </div>

          {/* Frequency-specific fields */}
          {entityType === 'frequency' && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Frequenz (Hz)
                </label>
                <input
                  type="number"
                  value={formData.hz || ''}
                  onChange={(e) => setFormData({ ...formData, hz: e.target.value })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                  min="1"
                  max="20000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('common.color')}
                </label>
                <input
                  type="color"
                  value={formData.color || '#8B5CF6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-11 rounded-lg"
                />
              </div>
            </>
          )}

          {/* Person-specific fields */}
          {entityType === 'person' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t('persons.email')} ({t('common.optional')})
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
              />
            </div>
          )}

          {/* Condition-specific fields */}
          {entityType === 'condition' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t('conditions.category')}
              </label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                required
              >
                <option value="">Kategorie wählen</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {t(`category.${cat.key}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description (for all except person) */}
          {entityType !== 'person' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t('common.description')} ({t('common.optional')})
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg p-4 text-white min-h-[80px]"
                rows={2}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Wird erstellt...' : 'Erstellen & Zuordnen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
