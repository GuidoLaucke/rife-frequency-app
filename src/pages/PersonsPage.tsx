import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { AssignmentModal } from '@/components/assignment/AssignmentModal';
import { QuickCreateModal } from '@/components/assignment/QuickCreateModal';
import { useNavigate } from 'react-router-dom';
import {
  getPersons,
  createPerson,
  updatePerson,
  deletePerson,
  type Person,
} from '@/lib/db';
import { Plus, Trash2, Edit, Users, Link as LinkIcon, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function PersonsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [persons, setPersons] = useState<Person[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
  });

  // Assignment modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assigningPerson, setAssigningPerson] = useState<{ id: number; name: string } | null>(null);
  
  // Quick create modal state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<'frequency' | 'sequence' | 'condition'>('frequency');

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    const data = await getPersons();
    setPersons(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const personData = {
        name: formData.name,
        email: formData.email,
        notes: formData.notes,
        updatedAt: new Date(),
      };

      let newId: number;

      if (editingPerson) {
        await updatePerson(editingPerson.id!, personData);
        toast.success(t('persons.updated'));
      } else {
        newId = await createPerson({
          ...personData,
          createdAt: new Date(),
        });
        toast.success(t('persons.created'));
        
        // Ask if user wants to assign
        const shouldAssign = confirm('Möchtest du dieser Person jetzt Frequenzen/Sequenzen zuordnen?');
        if (shouldAssign && newId) {
          const pers = await getPersons();
          const created = pers.find(p => p.id === newId);
          if (created) {
            setAssigningPerson({ id: newId, name: created.name });
            setShowAssignmentModal(true);
          }
        }
      }

      setShowModal(false);
      setEditingPerson(null);
      setFormData({ name: '', email: '', notes: '' });
      loadPersons();
    } catch (error) {
      toast.error('Error saving person');
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      email: person.email || '',
      notes: person.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.delete') + '?')) return;

    try {
      await deletePerson(id);
      toast.success(t('persons.deleted'));
      loadPersons();
    } catch (error) {
      toast.error('Error deleting person');
    }
  };

  const handleAssign = (person: Person) => {
    setAssigningPerson({ id: person.id!, name: person.name });
    setShowAssignmentModal(true);
  };

  // NEW: Navigate to player with person pre-selected
  const handlePlayPerson = (person: Person) => {
    navigate(`/player?person=${person.id}`);
  };

  const handleQuickCreate = (type: 'frequency' | 'sequence' | 'person' | 'condition') => {
    if (type !== 'person') {
      setQuickCreateType(type as any);
      setShowQuickCreate(true);
    }
  };

  const handleQuickCreated = async (newId: number) => {
    setShowQuickCreate(false);
    if (assigningPerson) {
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
                {t('persons.title')}
              </h1>
              <p className="text-muted-foreground">{t('persons.subtitle')}</p>
            </div>
            <button
              onClick={() => {
                setEditingPerson(null);
                setFormData({ name: '', email: '', notes: '' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-3 font-medium"
            >
              <Plus className="w-5 h-5" />
              {t('persons.new')}
            </button>
          </div>

          {/* Persons Grid */}
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {persons.map((person) => (
              <div
                key={person.id}
                className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-heading font-bold text-white mb-1 truncate">
                      {person.name}
                    </h3>
                    {person.email && (
                      <p className="text-muted-foreground text-sm truncate">{person.email}</p>
                    )}
                  </div>
                </div>

                {person.notes && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {person.notes}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* NEW: Player Button */}
                  <button
                    onClick={() => handlePlayPerson(person)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    title="Im Player öffnen"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleAssign(person)}
                    className="flex-1 flex items-center justify-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                    title="Zuordnen"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleEdit(person)}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(person.id!)}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-white">
                {editingPerson ? t('persons.edit') : t('persons.new')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-white"
              >
                <Plus className="w-6 h-6 rotate-45" />
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
                  {t('persons.email')} ({t('common.optional')})
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t('persons.notes')} ({t('common.optional')})
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg p-4 text-white min-h-[100px]"
                  rows={3}
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
      {assigningPerson && (
        <AssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setAssigningPerson(null);
          }}
          entityType="person"
          entityId={assigningPerson.id}
          entityName={assigningPerson.name}
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
