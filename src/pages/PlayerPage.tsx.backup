import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { FrequencyPlayer } from '@/components/FrequencyPlayer';
import { db } from '@/lib/db';
import type { Frequency, Sequence, Person } from '@/types';

export function PlayerPage() {
  const [mode, setMode] = useState<'single' | 'sequence'>('single');
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<number | null>(null);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [customHz, setCustomHz] = useState('');
  const [duration, setDuration] = useState(180);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [freqs, seqs, pers] = await Promise.all([
      db.getAll('frequencies'),
      db.getAll('sequences'),
      db.getAll('persons'),
    ]);
    setFrequencies(freqs);
    setSequences(seqs);
    setPersons(pers);
  };

  const handlePlayCustom = () => {
    const hz = parseFloat(customHz);
    if (!isNaN(hz) && hz >= 1 && hz <= 20000) {
      setSelectedFrequency(hz);
      setMode('single');
    }
  };

  const handlePersonChange = (personId: string) => {
    setSelectedPerson(personId);
    setSelectedFrequency(null);
    setSelectedSequence(null);
  };

  const availableFrequencies = selectedPerson
    ? frequencies.filter(f => {
        const person = persons.find(p => p.id === selectedPerson);
        return person?.assigned_frequencies?.includes(f.id);
      })
    : frequencies;

  const availableSequences = selectedPerson
    ? sequences.filter(s => {
        const person = persons.find(p => p.id === selectedPerson);
        return person?.assigned_sequences?.includes(s.id);
      })
    : sequences;

  const selectedPersonName = persons.find(p => p.id === selectedPerson)?.name;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-5xl font-heading font-bold text-white mb-2">Frequency Player</h1>
            <p className="text-muted-foreground">Play healing frequencies</p>
            {selectedPersonName && (
              <p className="text-sm text-primary mt-2">Für: {selectedPersonName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <FrequencyPlayer
                sequence={mode === 'sequence' && selectedSequence ? selectedSequence.frequencies : undefined}
                singleFrequency={mode === 'single' && selectedFrequency ? selectedFrequency : undefined}
                singleDuration={duration}
              />
            </div>

            <div className="space-y-6">
              {/* Person Selector */}
              <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <h3 className="font-heading font-semibold text-white mb-4">Person</h3>
                <select
                  value={selectedPerson || ''}
                  onChange={(e) => handlePersonChange(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                >
                  <option value="">Alle anzeigen</option>
                  {persons.map((person) => (
                    <option key={person.id} value={person.id} className="bg-black text-white">
                      {person.name}
                    </option>
                  ))}
                </select>
                {selectedPerson && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Zeigt nur zugeordnete Frequenzen & Sequenzen
                  </p>
                )}
              </div>

              {/* Mode Selector */}
              <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <h3 className="font-heading font-semibold text-white mb-4">Mode</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('single')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                      mode === 'single' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setMode('sequence')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                      mode === 'sequence' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    Sequence
                  </button>
                </div>
              </div>

              {/* Rest of the controls... */}
              {mode === 'single' && (
                <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                  <h3 className="font-heading font-semibold text-white mb-4">Select Frequency</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-muted-foreground mb-2">Custom Hz</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={customHz}
                        onChange={(e) => setCustomHz(e.target.value)}
                        placeholder="1-20000"
                        min="1"
                        max="20000"
                        className="flex-1 bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-10 px-4 text-white"
                      />
                      <button onClick={handlePlayCustom} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm">
                        Play
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-muted-foreground mb-2">Duration: {duration}s</label>
                    <input type="range" min="30" max="600" step="30" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full" />
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableFrequencies.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {selectedPerson ? 'Keine Frequenzen zugeordnet' : 'Keine Frequenzen verfügbar'}
                      </p>
                    ) : (
                      availableFrequencies.map((freq) => (
                        <button key={freq.id} onClick={() => { setSelectedFrequency(freq.hz); setMode('single'); }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                            selectedFrequency === freq.hz ? 'bg-primary/20 border border-primary/50' : 'bg-white/5 hover:bg-white/10'
                          }`}>
                          <div className="flex items-center gap-2">
                            {freq.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: freq.color, boxShadow: `0 0 8px ${freq.color}` }} />}
                            <div>
                              <div className="font-mono text-accent font-semibold">{freq.hz} Hz</div>
                              <div className="text-xs text-muted-foreground">{freq.name}</div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {mode === 'sequence' && (
                <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                  <h3 className="font-heading font-semibold text-white mb-4">Select Sequence</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableSequences.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {selectedPerson ? 'Keine Sequenzen zugeordnet' : 'Keine Sequenzen verfügbar'}
                      </p>
                    ) : (
                      availableSequences.map((seq) => (
                        <button key={seq.id} onClick={() => { setSelectedSequence(seq); setMode('sequence'); }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                            selectedSequence?.id === seq.id ? 'bg-primary/20 border border-primary/50' : 'bg-white/5 hover:bg-white/10'
                          }`}>
                          <div className="font-semibold text-white">{seq.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {seq.frequencies.length} frequencies • {seq.frequencies.reduce((sum, f) => sum + f.duration, 0)}s
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
