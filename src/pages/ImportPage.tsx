import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { createFrequency, createCondition, createSequence } from '@/lib/db';
import { Upload, Download, FileJson, FileSpreadsheet, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

type ImportType = 'frequencies' | 'conditions' | 'sequences';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function ImportPage() {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [importType, setImportType] = useState<ImportType>('frequencies');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension !== 'json' && extension !== 'csv') {
      toast.error('Only JSON and CSV files are supported');
      return;
    }

    setIsProcessing(true);
    setImportResult(null);

    try {
      const text = await file.text();
      let data: any[];

      if (extension === 'json') {
        data = JSON.parse(text);
      } else {
        data = parseCSV(text);
      }

      const result = await importData(data, importType);
      setImportResult(result);

      if (result.success > 0) {
        toast.success(`Imported ${result.success} ${importType}`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} items`);
      }
    } catch (error) {
      toast.error('Failed to parse file');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      data.push(obj);
    }

    return data;
  };

  const importData = async (data: any[], type: ImportType): Promise<ImportResult> => {
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (const item of data) {
      try {
        switch (type) {
          case 'frequencies':
            await importFrequency(item);
            break;
          case 'conditions':
            await importCondition(item);
            break;
          case 'sequences':
            await importSequence(item);
            break;
        }
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to import: ${JSON.stringify(item)}`);
      }
    }

    return result;
  };

  const importFrequency = async (data: any) => {
    const hz = parseFloat(data.hz || data.frequency || data.Hz);
    if (isNaN(hz) || hz < 1 || hz > 20000) {
      throw new Error('Invalid frequency');
    }

    const freq: Frequency = {
      id: crypto.randomUUID(),
      hz,
      name: data.name || `Frequency ${hz}Hz`,
      description: data.description || '',
      conditions: [],
      is_predefined: false,
      created_at: new Date(),
      created_by: user?.id,
    };

    await db.add('frequencies', freq);
  };

  const importCondition = async (data: any) => {
    const cond: Condition = {
      id: crypto.randomUUID(),
      name: data.name || 'Unnamed Condition',
      description: data.description || '',
      category: data.category || 'General',
      created_at: new Date(),
    };

    await db.add('conditions', cond);
  };

  const importSequence = async (data: any) => {
    let frequencies = [];
    
    if (typeof data.frequencies === 'string') {
      frequencies = JSON.parse(data.frequencies);
    } else if (Array.isArray(data.frequencies)) {
      frequencies = data.frequencies;
    } else {
      throw new Error('Invalid sequence format');
    }

    const seq: Sequence = {
      id: crypto.randomUUID(),
      name: data.name || 'Imported Sequence',
      frequencies: frequencies.map((f: any) => ({
        hz: parseFloat(f.hz || f.frequency),
        duration: parseInt(f.duration) || 60,
      })),
      created_by: user!.id,
      created_at: new Date(),
    };

    await db.add('sequences', seq);
  };

  const downloadTemplate = (type: ImportType) => {
    let content = '';
    let filename = '';

    switch (type) {
      case 'frequencies':
        content = JSON.stringify([
          { hz: 727, name: 'Example Frequency', description: 'General pathogen frequency' },
          { hz: 880, name: 'Another Example', description: 'Streptococcus frequency' },
        ], null, 2);
        filename = 'frequencies-template.json';
        break;
      case 'conditions':
        content = JSON.stringify([
          { name: 'Example Condition', description: 'Description here', category: 'Infections' },
          { name: 'Another Condition', description: 'Another description', category: 'Pain' },
        ], null, 2);
        filename = 'conditions-template.json';
        break;
      case 'sequences':
        content = JSON.stringify([
          {
            name: 'Example Sequence',
            frequencies: [
              { hz: 727, duration: 180 },
              { hz: 880, duration: 120 },
              { hz: 787, duration: 180 },
            ],
          },
        ], null, 2);
        filename = 'sequences-template.json';
        break;
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-heading font-bold text-white mb-2">Import Data</h1>
            <p className="text-muted-foreground">Import frequencies, conditions, or sequences from JSON or CSV files</p>
          </div>

          {/* Type Selector */}
          <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 mb-8">
            <h3 className="font-heading font-semibold text-white mb-4">Import Type</h3>
            <div className="grid grid-cols-3 gap-4">
              {(['frequencies', 'conditions', 'sequences'] as ImportType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setImportType(type)}
                  className={`p-4 rounded-lg transition-all ${
                    importType === type
                      ? 'bg-primary text-white border border-primary/50'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <p className="font-medium capitalize">{type}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative backdrop-blur-md bg-white/5 border-2 border-dashed rounded-xl p-12 transition-all ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="text-center">
              <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <h3 className="text-xl font-heading font-semibold text-white mb-2">
                {isDragging ? 'Drop file here' : 'Drag & drop your file'}
              </h3>
              <p className="text-muted-foreground mb-6">
                or click to browse (JSON or CSV)
              </p>
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 font-medium cursor-pointer transition-all hover:scale-105"
              >
                <FileJson className="w-5 h-5" />
                Choose File
              </label>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
                  <p className="text-white font-medium">Processing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="mt-8 backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
              <h3 className="font-heading font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-accent" />
                Import Results
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-white">Successfully imported: <strong>{importResult.success}</strong></span>
                </div>
                {importResult.failed > 0 && (
                  <div className="flex items-center gap-3">
                    <X className="w-5 h-5 text-destructive" />
                    <span className="text-white">Failed: <strong>{importResult.failed}</strong></span>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-destructive font-medium mb-2">Errors:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {importResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>... and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Templates */}
          <div className="mt-8 backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
            <h3 className="font-heading font-semibold text-white mb-4">Download Templates</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Download example files to see the expected format
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => downloadTemplate('frequencies')}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-lg px-4 py-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Frequencies
              </button>
              <button
                onClick={() => downloadTemplate('conditions')}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-lg px-4 py-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Conditions
              </button>
              <button
                onClick={() => downloadTemplate('sequences')}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-lg px-4 py-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Sequences
              </button>
            </div>
          </div>

          {/* Format Guide */}
          <div className="mt-8 backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
            <h3 className="font-heading font-semibold text-white mb-4">Format Guide</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-accent font-medium mb-2">Frequencies (JSON):</h4>
                <pre className="bg-black/40 p-3 rounded-lg overflow-x-auto">
                  <code className="text-muted-foreground">{`[
  { "hz": 727, "name": "Name", "description": "..." },
  { "hz": 880, "name": "Name", "description": "..." }
]`}</code>
                </pre>
              </div>
              <div>
                <h4 className="text-accent font-medium mb-2">Frequencies (CSV):</h4>
                <pre className="bg-black/40 p-3 rounded-lg overflow-x-auto">
                  <code className="text-muted-foreground">{`hz,name,description
727,General Pathogen,Classic Rife frequency
880,Streptococcus,For strep infections`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
