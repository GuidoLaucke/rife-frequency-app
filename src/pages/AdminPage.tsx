/**
 * AdminPage.tsx - Invite Code Management
 * Date: 2025-04-24
 * 
 * FEATURES:
 * - View all invite codes
 * - Create new invite codes
 * - Delete invite codes
 * - See usage statistics
 * - Admin-only access
 * 
 * DEPENDENCIES:
 * - db.ts v3.2+ (InviteCode functions)
 * - auth.tsx v1.5+ (useIsAdmin hook)
 * 
 * INSTALL:
 * 1. cp ~/Downloads/AdminPage-20250424.tsx src/pages/AdminPage.tsx
 * 2. Add route in App.tsx
 * 3. Add sidebar link (admin only)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '../lib/auth';
import { 
  getAllInviteCodes, 
  createInviteCode, 
  deleteInviteCode,
  type InviteCode 
} from '../lib/db';
import { Shield, Plus, Trash2, Key, Users, Calendar, X } from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [newCode, setNewCode] = useState('');
  const [hasPremium, setHasPremium] = useState(true);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');

  // Load codes
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    loadCodes();
  }, [isAdmin, navigate]);

  async function loadCodes() {
    setLoading(true);
    try {
      const allCodes = await getAllInviteCodes();
      setCodes(allCodes);
    } catch (error) {
      console.error('Failed to load codes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCode() {
    if (!newCode.trim()) {
      alert('Code darf nicht leer sein');
      return;
    }

    try {
      await createInviteCode({
        code: newCode.trim().toUpperCase(),
        hasPremium,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      // Reset form
      setNewCode('');
      setHasPremium(true);
      setMaxUses(1);
      setExpiresAt('');
      setShowCreateForm(false);

      // Reload codes
      await loadCodes();
    } catch (error) {
      console.error('Failed to create code:', error);
      alert('Code konnte nicht erstellt werden. Existiert er bereits?');
    }
  }

  async function handleDeleteCode(id: number) {
    if (!confirm('Code wirklich löschen?')) return;

    try {
      await deleteInviteCode(id);
      await loadCodes();
    } catch (error) {
      console.error('Failed to delete code:', error);
      alert('Code konnte nicht gelöscht werden');
    }
  }

  function generateRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
  }

  // Access control
  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Lade...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showCreateForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showCreateForm ? 'Abbrechen' : 'Neuer Code'}
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Key className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground text-sm">Gesamt Codes</span>
            </div>
            <div className="text-3xl font-bold text-white">{codes.length}</div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="text-muted-foreground text-sm">Premium Codes</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {codes.filter(c => c.hasPremium).length}
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-muted-foreground text-sm">Verwendet</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {codes.reduce((sum, c) => sum + c.currentUses, 0)}
            </div>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-card rounded-lg p-6 border border-border mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Neuen Invite-Code erstellen</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="z.B. LORENZ2025"
                    className="flex-1 bg-background text-white px-4 py-2 rounded-lg border border-border focus:border-primary outline-none"
                  />
                  <button
                    onClick={generateRandomCode}
                    className="bg-secondary/20 hover:bg-secondary/30 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Zufällig
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Maximale Nutzungen
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value))}
                  className="w-full bg-background text-white px-4 py-2 rounded-lg border border-border focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <input
                    type="checkbox"
                    checked={hasPremium}
                    onChange={(e) => setHasPremium(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />
                  Premium-Zugang gewähren
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  User erhält 1000 Frequenzen + 200 Conditions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Ablaufdatum (optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-background text-white px-4 py-2 rounded-lg border border-border focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateCode}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Code erstellen
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-secondary/20 hover:bg-secondary/30 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Codes List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-white">Invite-Codes</h2>
          </div>

          {codes.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Noch keine Codes erstellt</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Code</th>
                    <th className="px-6 py-3 font-medium">Typ</th>
                    <th className="px-6 py-3 font-medium">Nutzungen</th>
                    <th className="px-6 py-3 font-medium">Verwendet von</th>
                    <th className="px-6 py-3 font-medium">Erstellt</th>
                    <th className="px-6 py-3 font-medium">Läuft ab</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {codes.map((code) => (
                    <tr key={code.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4">
                        <code className="bg-primary/10 text-primary px-3 py-1 rounded font-mono text-sm">
                          {code.code}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {code.hasPremium ? (
                          <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-medium">
                            Premium
                          </span>
                        ) : (
                          <span className="bg-gray-500/10 text-gray-400 px-3 py-1 rounded-full text-xs font-medium">
                            Basic
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white">
                        {code.currentUses} / {code.maxUses}
                      </td>
                      <td className="px-6 py-4">
                        {code.usedBy.length > 0 ? (
                          <div className="text-sm text-muted-foreground">
                            {code.usedBy.slice(0, 2).map((email, i) => (
                              <div key={i}>{email}</div>
                            ))}
                            {code.usedBy.length > 2 && (
                              <div className="text-xs">+{code.usedBy.length - 2} weitere</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(code.createdAt).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {code.expiresAt 
                          ? new Date(code.expiresAt).toLocaleDateString('de-DE')
                          : '—'
                        }
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteCode(code.id!)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
