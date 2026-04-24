import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { createFrequency, createCondition, createSequence } from '@/lib/db';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImportResult {
  frequencies: number;
  conditions: number;
  sequences: number;
  errors: string[];
}

export function ImportPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const importResult: ImportResult = {
        frequencies: 0,
        conditions: 0,
        sequences: 0,
        errors: [],
      };

      // Import frequencies
      if (data.frequencies && Array.isArray(data.frequencies)) {
        for (const freq of data.frequencies) {
          try {
            await createFrequency({
              name: freq.name,
              hz: freq.hz,
              description: freq.description || '',
              color: freq.color || '#8B5CF6',
              isPredefined: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            importResult.frequencies++;
          } catch (error) {
            importResult.errors.push(`Frequenz ${freq.name}: ${error}`);
          }
        }
      }

      // Import conditions
      if (data.conditions && Array.isArray(data.conditions)) {
        for (const cond of data.conditions) {
          try {
            await createCondition({
              name: cond.name,
              description: cond.description || '',
              categoryId: cond.categoryId || 1,
              tags: cond.tags || [],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            importResult.conditions++;
          } catch (error) {
            importResult.errors.push(`Anwendungsgebiet ${cond.name}: ${error}`);
          }
        }
      }

      // Import sequences
      if (data.sequences && Array.isArray(data.sequences)) {
        for (const seq of data.sequences) {
          try {
            await createSequence({
              name: seq.name,
              description: seq.description || '',
              frequencies: seq.frequencies || [],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            importResult.sequences++;
          } catch (error) {
            importResult.errors.push(`Sequenz ${seq.name}: ${error}`);
          }
        }
      }

      setResult(importResult);
      
      if (importResult.errors.length === 0) {
        toast.success('Import erfolgreich abgeschlossen');
      } else {
        toast.warning('Import mit Fehlern abgeschlossen');
      }
    } catch (error) {
      toast.error('Fehler beim Importieren der Datei');
      setResult({
        frequencies: 0,
        conditions: 0,
        sequences: 0,
        errors: ['Ungültiges Dateiformat'],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
              Daten importieren
            </h1>
            <p className="text-muted-foreground">
              Importiere Frequenzen, Anwendungsgebiete und Sequenzen aus einer JSON-Datei
            </p>
          </div>

          {/* Upload Area */}
          <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-8 mb-6">
            <div className="text-center">
              <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-heading font-bold text-white mb-2">
                Datei hochladen
              </h2>
              <p className="text-muted-foreground mb-6">
                Wähle eine JSON-Datei zum Importieren
              </p>
              
              <label className="inline-block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-3 font-medium cursor-pointer transition-all disabled:opacity-50">
                  <FileText className="w-5 h-5" />
                  {importing ? 'Importiere...' : 'Datei auswählen'}
                </span>
              </label>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
              <h3 className="text-xl font-heading font-bold text-white mb-4">
                Import-Ergebnis
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-white">
                    {result.frequencies} Frequenzen importiert
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-white">
                    {result.conditions} Anwendungsgebiete importiert
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                  <span className="text-white">
                    {result.sequences} Sequenzen importiert
                  </span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <h4 className="text-white font-semibold">Fehler ({result.errors.length})</h4>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-destructive/10 rounded text-destructive text-sm">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Format Info */}
          <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 mt-6">
            <h3 className="text-lg font-heading font-bold text-white mb-3">
              Dateiformat
            </h3>
            <p className="text-muted-foreground text-sm mb-3">
              Die JSON-Datei sollte folgende Struktur haben:
            </p>
            <pre className="bg-black/20 rounded-lg p-4 text-sm text-white overflow-x-auto">
{`{
  "frequencies": [
    {
      "name": "Frequenz Name",
      "hz": 528,
      "description": "Beschreibung",
      "color": "#8B5CF6"
    }
  ],
  "conditions": [
    {
      "name": "Anwendungsgebiet",
      "description": "Beschreibung",
      "categoryId": 1,
      "tags": ["tag1", "tag2"]
    }
  ],
  "sequences": [
    {
      "name": "Sequenz Name",
      "description": "Beschreibung",
      "frequencies": [
        {
          "frequencyId": 1,
          "duration": 60
        }
      ]
    }
  ]
}`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
