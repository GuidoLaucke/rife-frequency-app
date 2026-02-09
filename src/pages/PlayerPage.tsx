import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { FrequencyPlayer } from '@/components/FrequencyPlayer';
import { db } from '@/lib/db';
import type { Frequency, Sequence } from '@/types';

export function PlayerPage() {
  const [mode, setMode] = useState<'single' | 'sequence'>('single');
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedFrequency, setSelectedFrequency] = useState<number | null>(null);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [customHz, setCustomHz] = useState('');
  const [duration, setDuration] = useState(180); // 3 minutes default

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [freqs, seqs] = await Promise.all([
      db.getAll('frequencies'),
      db.getAll('sequences'),
    ]);
    setFrequencies(freqs);
    setSequences(seqs);
  };

  const handlePlayCustom = () => {
    const hz = parseFloat(customHz);
    if (!isNaN(hz) && hz >= 1 && hz <= 20000) {
      setSelectedFrequency(hz);
      setMode('single');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-heading font-bold text-white mb-2">Frequency Player</h1>
            <p className="text-muted-foreground">Play healing frequencies</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Player */}
            <div className="lg:col-span-2">
              <FrequencyPlayer
                sequence={mode === 'sequence' && selectedSequence ? selectedSequence.frequencies : undefined}
                singleFrequency={mode === 'single' && selectedFrequency ? selectedFrequency : undefined}
                singleDuration={duration}
              />
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Mode Selector */}
              <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <h3 className="font-heading font-semibold text-white mb-4">Mode</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('single')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                      mode === 'single'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setMode('sequence')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                      mode === 'sequence'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    Sequence
                  </button>
                </div>
              </div>

              {/* Single Mode */}
              {mode === 'single' && (
                <>
                  {/* Custom Frequency */}
                  <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                    <h3 className="font-heading font-semibold text-white mb-4">Custom Frequency</h3>
                    <div className="space-y-3">
                      <input
                        type="number"
                        placeholder="Enter Hz (1-20000)"
                        value={customHz}
                        onChange={(e) => setCustomHz(e.target.value)}
                        className="w-full bg-black/20 border-white/10 focus:border-primary/50 rounded-lg h-11 px-4 text-white"
                        min="1"
                        max="20000"
                      />
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                        </label>
                        <input
                          type="range"
                          min="30"
                          max="600"
                          step="30"
                          value={duration}
                          onChange={(e) => setDuration(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <button
                        onClick={handlePlayCustom}
                        disabled={!customHz}
                        className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 transition-all disabled:opacity-50"
                      >
                        Play Custom
                      </button>
                    </div>
                  </div>

                  {/* Predefined Frequencies */}
                  <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                    <h3 className="font-heading font-semibold text-white mb-4">Frequencies</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {frequencies.map((freq) => (
                        <button
                          key={freq.id}
                          onClick={() => {
                            setSelectedFrequency(freq.hz);
                            setCustomHz(freq.hz.toString());
                          }}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedFrequency === freq.hz
                              ? 'bg-primary/20 border border-primary/50'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <p className="font-medium text-white text-sm">{freq.name}</p>
                          <p className="text-xs text-accent font-mono">{freq.hz} Hz</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Sequence Mode */}
              {mode === 'sequence' && (
                <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                  <h3 className="font-heading font-semibold text-white mb-4">Sequences</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sequences.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No sequences yet
                      </p>
                    ) : (
                      sequences.map((seq) => (
                        <button
                          key={seq.id}
                          onClick={() => setSelectedSequence(seq)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            selectedSequence?.id === seq.id
                              ? 'bg-primary/20 border border-primary/50'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <p className="font-medium text-white text-sm">{seq.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {seq.frequencies.length} frequencies
                          </p>
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
