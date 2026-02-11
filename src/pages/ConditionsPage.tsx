import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { db } from '@/lib/db';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Condition, Category } from '@/types';

export function ConditionsPage() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    category: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [conds, cats] = await Promise.all([
      db.getAll('conditions'),
      db.getAll('categories'),
    ]);
    setConditions(conds);
    setCategories(cats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const condData: Condition = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      category: formData.category,
      tags: formData.tags,
      created_at: new Date(),
    };

    if (editingId) {
      await db.update('conditions', condData);
      toast.success('Anwendungsgebiet aktualisiert');
    } else {
      await db.add('conditions', condData);
      toast.success('Anwendungsgebiet erstellt');
    }

    setShowModal(false);
    setFormData({ name: '', description: '', category: '', tags: [] });
    setEditingId(null);
    loadData();
  };

  const handleEdit = (cond: Condition) => {
    setEditingId(cond.id);
    setFormData({
      name: cond.name,
      description: cond.description,
      category: cond.category,
      tags: cond.tags || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Dieses Anwendungsgebiet löschen?')) {
      await db.delete('conditions', id);
      toast.success('Anwendungsgebiet gelöscht');
      loadData();
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name_de || categoryId;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-heading font-bold text-white mb-2">Anwendungsgebiete</h1>
              <p className="text-muted-foreground">Verwalte deine Anwendungsgebiete</p>
            </div>
            <button
              onClick={() => { 
                setShowModal(true); 
                setEditingId(null); 
                setFormData({ name: '', description: '', category: '', tags: [] }); 
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 font-medium shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Neues Anwendungsgebiet
            </button>
          </div>

          {/* Group by Category */}
          {categories.map((category) => {
            const categoryConditions = conditions.filter(c => c.category === category.id);
            if (categoryConditions.length === 0) return null;

            return (
              <div key={category.id} className="mb-8">
                <h2 className="text-2xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
                  📁 {category.name_de}
                  <span className="text-sm text-muted-foreground font-normal">({categoryConditions.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryConditions.map((cond) => (
                    <div key={cond.id} className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-heading font-semibold text-white">{cond.name}</h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(cond)} 
                            className="text-muted-foreground hover:text-white transition-colors"
                            title="Bearbeiten"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(cond.id)} 
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{cond.description}</p>
                      {cond.tags && cond.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {cond.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent border border-accent/30">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {conditions.length === 0 && (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-12 text-center">
              <p className="text-muted-foreground">Noch keine Anwendungsgebiete. Erstelle dein erstes!</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">
              {editingId ? 'Bearbeiten' : 'Neues'} Anwendungsgebiet
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Kategorie *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                >
                  <option value="">Kategorie wählen...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-black text-white">
                      {cat.name_de}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="z.B. Kopfschmerz, Wohlstand, Entspannung"
                  className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Optionale Beschreibung..."
                  className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg p-4 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Stichwörter (Tags)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tag hinzufügen..."
                    className="flex-1 bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg h-10 px-4 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-accent/20 hover:bg-accent/30 text-accent rounded-lg px-4 h-10 font-medium text-sm transition-colors"
                  >
                    Hinzufügen
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Beispiele: Schmerz, Kopf, Akut, Chronisch, Geld, Erfolg
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium">
                  {editingId ? 'Speichern' : 'Erstellen'}
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
