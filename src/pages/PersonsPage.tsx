import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { db } from '@/lib/db';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import type { Person } from '@/types';

export function PersonsPage() {
  const { user } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', notes: '' });

  useEffect(() => { loadPersons(); }, []);

  const loadPersons = async () => {
    const data = await db.getAll('persons');
    setPersons(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const personData: Person = {
      id: crypto.randomUUID(),
      ...formData,
      conditions: [],
      assigned_frequencies: [],
      created_at: new Date(),
      created_by: user!.id,
    };

    await db.add('persons', personData);
    toast.success('Person created');
    setShowModal(false);
    setFormData({ name: '', email: '', notes: '' });
    loadPersons();
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
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 font-medium">
              <Plus className="w-5 h-5" />
              New Person
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {persons.map((person) => (
              <div key={person.id} className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <h3 className="font-heading font-semibold text-white mb-2">{person.name}</h3>
                {person.email && <p className="text-sm text-accent mb-2">{person.email}</p>}
                {person.notes && <p className="text-sm text-muted-foreground">{person.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">New Person</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg p-4 text-white resize-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
