import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useRole } from '@/lib/role';
import { useTranslation } from 'react-i18next';
import { getDefaultTranslations, saveTranslations } from '@/lib/i18n';
import { Save, Download, Upload, Plus, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function AdminPage() {
  const { isAdmin, loginAsAdmin } = useRole();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(!isAdmin);
  const [translations, setTranslations] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setShowLogin(true);
    } else {
      loadTranslations();
    }
  }, [isAdmin]);

  const loadTranslations = () => {
    const stored = localStorage.getItem('alchewat_translations');
    if (stored) {
      setTranslations(JSON.parse(stored));
    } else {
      setTranslations(getDefaultTranslations());
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAsAdmin(password);
    if (success) {
      setShowLogin(false);
      toast.success('Admin access granted');
      loadTranslations();
    } else {
      toast.error('Invalid password');
    }
  };

  const handleSave = () => {
    if (saveTranslations(translations)) {
      toast.success('Translations saved');
      // Reload i18n
      i18n.reloadResources();
    } else {
      toast.error('Failed to save translations');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(translations, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translations.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported translations');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setTranslations(imported);
        toast.success('Imported translations');
      } catch (error) {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const updateTranslation = (key: string, lang: string, value: string) => {
    setTranslations((prev: any) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        translation: {
          ...prev[lang].translation,
          [key]: value,
        },
      },
    }));
  };

  const addNewKey = () => {
    const key = prompt('Enter new translation key (e.g., "menu.help"):');
    if (!key) return;

    setTranslations((prev: any) => {
      const updated = { ...prev };
      ['de', 'en', 'it', 'ru'].forEach((lang) => {
        updated[lang] = {
          ...updated[lang],
          translation: {
            ...updated[lang].translation,
            [key]: '',
          },
        };
      });
      return updated;
    });
    setEditingKey(key);
    toast.success('New key added');
  };

  const deleteKey = (key: string) => {
    if (!confirm(`Delete key "${key}"?`)) return;

    setTranslations((prev: any) => {
      const updated = { ...prev };
      ['de', 'en', 'it', 'ru'].forEach((lang) => {
        const { [key]: _, ...rest } = updated[lang].translation;
        updated[lang].translation = rest;
      });
      return updated;
    });
    toast.success('Key deleted');
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="backdrop-blur-2xl bg-black/60 rounded-2xl border border-white/10 p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-bold text-white mb-2">Admin Access</h1>
            <p className="text-muted-foreground">Enter password to access admin panel</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
              autoFocus
            />
            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 font-medium">
                Login
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const keys = translations.de ? Object.keys(translations.de.translation) : [];
  const filteredKeys = keys.filter((key) => key.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-heading font-bold text-white mb-2">Translation Admin</h1>
              <p className="text-muted-foreground">Manage translations for all languages</p>
            </div>
            <div className="flex gap-3">
              <button onClick={addNewKey} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2">
                <Plus className="w-4 h-4" />
                Add Key
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white rounded-lg px-4 py-2">
                <Save className="w-4 h-4" />
                Save
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <label className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-white rounded-lg px-4 py-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Import
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 mb-6">
            <input
              type="text"
              placeholder="Search translation keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
            />
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-48">Key</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">🇩🇪 DE</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">🇬🇧 EN</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">🇮🇹 IT</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">🇷🇺 RU</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredKeys.map((key) => (
                    <tr key={key} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white font-mono text-xs">{key}</td>
                      {['de', 'en', 'it', 'ru'].map((lang) => (
                        <td key={lang} className="px-4 py-3">
                          <input
                            type="text"
                            value={translations[lang]?.translation[key] || ''}
                            onChange={(e) => updateTranslation(key, lang, e.target.value)}
                            className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded px-2 py-1 text-white text-sm"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteKey(key)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground text-center">
            Total keys: {keys.length} | Filtered: {filteredKeys.length}
          </div>
        </div>
      </main>
    </div>
  );
}
