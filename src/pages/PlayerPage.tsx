/**
 * PlayerPage v2.3 - With Condition Support
 * File: PlayerPage-v2.3-condition-support-20250424.tsx
 * Date: 2025-04-24
 * 
 * CHANGES v2.3:
 * - Added: Condition support via location.state
 * - Added: Auto-load condition frequencies from ConditionsPage
 * - Added: Display condition name when playing from condition
 * - Added: Condition mode (plays frequencies from condition directly)
 * 
 * PREVIOUS CHANGES:
 * v2.2: Create buttons for Person/Frequency/Sequence
 * v2.1: Wave visualization with 4 waveform types
 * v2.0: Person filtering working
 * 
 * DEPENDENCIES:
 * - db.ts v3.1+
 * - react-router-dom
 * - Web Audio API
 */

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { 
  getFrequencies, 
  getSequences, 
  getPersons,
  getFrequenciesForPerson,
  getSequencesForPerson,
  type Frequency, 
  type Sequence, 
  type Person 
} from '@/lib/db';
import { Play, Pause, Volume2, Users, Radio, ListOrdered, Plus, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

// Condition frequency from navigation state
interface ConditionFrequency {
  hz: number;
  duration: number;
}

export function PlayerPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [allFrequencies, setAllFrequencies] = useState<Frequency[]>([]);
  const [allSequences, setAllSequences] = useState<Sequence[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  
  const [displayFrequencies, setDisplayFrequencies] = useState<Frequency[]>([]);
  const [displaySequences, setDisplaySequences] = useState<Sequence[]>([]);
  
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [mode, setMode] = useState<'single' | 'sequence' | 'condition'>('single');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [volume, setVolume] = useState(50);
  const [currentFrequencyIndex, setCurrentFrequencyIndex] = useState(0);
  const [waveType, setWaveType] = useState<OscillatorType>('sine');

  const [selectedFrequencyIds, setSelectedFrequencyIds] = useState<number[]>([]);
  const [selectedSequenceIds, setSelectedSequenceIds] = useState<number[]>([]);

  // NEW: Condition state
  const [conditionId, setConditionId] = useState<number | null>(null);
  const [conditionName, setConditionName] = useState<string | null>(null);
  const [conditionFrequencies, setConditionFrequencies] = useState<ConditionFrequency[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    loadData();
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    
    gainNodeRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
    
    return () => {
      stopAudio();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContextRef.current?.close();
    };
  }, []);

  // NEW: Handle condition from navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.conditionId && state?.frequencies) {
      setConditionId(state.conditionId);
      setConditionName(state.conditionName || 'Anwendungsgebiet');
      setConditionFrequencies(state.frequencies);
      setMode('condition');
      setSelectedFrequencyIds([]);
      setSelectedSequenceIds([]);
    }
  }, [location.state]);

  useEffect(() => {
    const personId = searchParams.get('person');
    const frequencyId = searchParams.get('frequency');
    const sequenceId = searchParams.get('sequence');

    if (personId) {
      handlePersonChange(Number(personId));
    }
    if (frequencyId && allFrequencies.length > 0) {
      setMode('single');
      const freq = allFrequencies.find(f => f.id === Number(frequencyId));
      if (freq) {
        setSelectedFrequencyIds([freq.id!]);
      }
    }
    if (sequenceId && allSequences.length > 0) {
      setMode('sequence');
      const seq = allSequences.find(s => s.id === Number(sequenceId));
      if (seq) {
        setSelectedSequenceIds([seq.id!]);
      }
    }
  }, [searchParams, allFrequencies, allSequences]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
  }, [volume]);

  const loadData = async () => {
    const [freqs, seqs, pers] = await Promise.all([
      getFrequencies(),
      getSequences(),
      getPersons(),
    ]);
    setAllFrequencies(freqs);
    setAllSequences(seqs);
    setPersons(pers);
    setDisplayFrequencies(freqs);
    setDisplaySequences(seqs);
  };

  const handlePersonChange = async (personId: number | null) => {
    setSelectedPerson(personId);
    
    if (personId === null) {
      setDisplayFrequencies(allFrequencies);
      setDisplaySequences(allSequences);
      setSelectedFrequencyIds([]);
      setSelectedSequenceIds([]);
    } else {
      const [personFreqs, personSeqs] = await Promise.all([
        getFrequenciesForPerson(personId),
        getSequencesForPerson(personId),
      ]);
      
      setDisplayFrequencies(personFreqs);
      setDisplaySequences(personSeqs);
      setSelectedFrequencyIds(personFreqs.map(f => f.id!));
      setSelectedSequenceIds(personSeqs.map(s => s.id!));
    }
  };

  const handleToggleFrequency = (frequencyId: number) => {
    setSelectedFrequencyIds(prev => 
      prev.includes(frequencyId)
        ? prev.filter(id => id !== frequencyId)
        : [...prev, frequencyId]
    );
  };

  const handleToggleSequence = (sequenceId: number) => {
    setSelectedSequenceIds(prev => 
      prev.includes(sequenceId)
        ? prev.filter(id => id !== sequenceId)
        : [...prev, sequenceId]
    );
  };

  const drawWave = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyserRef.current!.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#8B5CF6';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const stopAudio = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const playFrequency = (hz: number) => {
    if (!audioContextRef.current || !gainNodeRef.current || !analyserRef.current) return;

    stopAudio();

    oscillatorRef.current = audioContextRef.current.createOscillator();
    oscillatorRef.current.type = waveType;
    oscillatorRef.current.frequency.value = hz;
    oscillatorRef.current.connect(gainNodeRef.current);
    oscillatorRef.current.start();

    drawWave();
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAudio();
    } else {
      // NEW: Condition mode
      if (mode === 'condition' && conditionFrequencies.length > 0) {
        const firstFreq = conditionFrequencies[0];
        playFrequency(firstFreq.hz);
        setIsPlaying(true);
        setCurrentTime(0);
        setCurrentFrequencyIndex(0);
        setDuration(firstFreq.duration);
      } else if (mode === 'single' && selectedFrequencyIds.length > 0) {
        const firstFreq = allFrequencies.find(f => f.id === selectedFrequencyIds[0]);
        if (firstFreq) {
          playFrequency(firstFreq.hz);
          setIsPlaying(true);
          setCurrentTime(0);
          setCurrentFrequencyIndex(0);
        }
      } else if (mode === 'sequence' && selectedSequenceIds.length > 0) {
        const firstSeq = allSequences.find(s => s.id === selectedSequenceIds[0]);
        if (firstSeq && firstSeq.frequencies && firstSeq.frequencies.length > 0) {
          const firstFreq = allFrequencies.find(f => f.id === firstSeq.frequencies[0].frequencyId);
          if (firstFreq) {
            playFrequency(firstFreq.hz);
            setIsPlaying(true);
            setCurrentTime(0);
            setCurrentFrequencyIndex(0);
            setDuration(firstSeq.frequencies[0].duration);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration - 1) {
          // NEW: Condition mode playback
          if (mode === 'condition' && conditionFrequencies.length > 0) {
            const nextIndex = currentFrequencyIndex + 1;
            if (nextIndex < conditionFrequencies.length) {
              const nextFreq = conditionFrequencies[nextIndex];
              playFrequency(nextFreq.hz);
              setCurrentFrequencyIndex(nextIndex);
              setDuration(nextFreq.duration);
              return 0;
            } else {
              setIsPlaying(false);
              stopAudio();
              return 0;
            }
          } else if (mode === 'sequence' && selectedSequenceIds.length > 0) {
            const currentSeq = allSequences.find(s => s.id === selectedSequenceIds[0]);
            if (currentSeq && currentSeq.frequencies) {
              const nextIndex = currentFrequencyIndex + 1;
              if (nextIndex < currentSeq.frequencies.length) {
                const nextFreqData = currentSeq.frequencies[nextIndex];
                const nextFreq = allFrequencies.find(f => f.id === nextFreqData.frequencyId);
                if (nextFreq) {
                  playFrequency(nextFreq.hz);
                  setCurrentFrequencyIndex(nextIndex);
                  setDuration(nextFreqData.duration);
                  return 0;
                }
              } else {
                setIsPlaying(false);
                stopAudio();
                return 0;
              }
            }
          } else if (mode === 'single') {
            setIsPlaying(false);
            stopAudio();
            return 0;
          }
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, duration, mode, selectedSequenceIds, currentFrequencyIndex, allFrequencies, allSequences, conditionFrequencies]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentFrequencyName = () => {
    if (mode === 'condition' && conditionFrequencies.length > 0) {
      const freq = conditionFrequencies[currentFrequencyIndex];
      return freq ? `${conditionName} - ${freq.hz} Hz` : '';
    } else if (mode === 'single' && selectedFrequencyIds.length > 0) {
      const freq = allFrequencies.find(f => f.id === selectedFrequencyIds[0]);
      return freq ? `${freq.name} (${freq.hz} Hz)` : '';
    } else if (mode === 'sequence' && selectedSequenceIds.length > 0) {
      const seq = allSequences.find(s => s.id === selectedSequenceIds[0]);
      if (seq && seq.frequencies && seq.frequencies[currentFrequencyIndex]) {
        const freqData = seq.frequencies[currentFrequencyIndex];
        const freq = allFrequencies.find(f => f.id === freqData.frequencyId);
        return freq ? `${freq.name} (${freq.hz} Hz)` : '';
      }
    }
    return '';
  };

  const handleClearCondition = () => {
    setConditionId(null);
    setConditionName(null);
    setConditionFrequencies([]);
    setMode('single');
    setIsPlaying(false);
    stopAudio();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">Player</h1>
            <p className="text-muted-foreground">Spiele Frequenzen und Sequenzen ab</p>
          </div>

          {/* NEW: Condition Banner */}
          {mode === 'condition' && conditionName && (
            <div className="backdrop-blur-md bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Anwendungsgebiet</p>
                    <h3 className="text-xl font-heading font-bold text-white">{conditionName}</h3>
                    <p className="text-sm text-accent mt-1">{conditionFrequencies.length} Frequenzen</p>
                  </div>
                </div>
                <button
                  onClick={handleClearCondition}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
                >
                  Zurücksetzen
                </button>
              </div>
            </div>
          )}

          {/* Person Selection */}
          {mode !== 'condition' && (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-secondary" />
                  <h2 className="text-xl font-heading font-bold text-white">Person wählen</h2>
                </div>
                <button
                  onClick={() => navigate('/persons')}
                  className="flex items-center gap-2 bg-secondary/40 hover:bg-secondary/50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Neue Person
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handlePersonChange(null)} className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedPerson === null ? 'bg-secondary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Alle</button>
                {persons.map(person => (
                  <button key={person.id} onClick={() => handlePersonChange(person.id!)} className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedPerson === person.id ? 'bg-secondary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>{person.name}</button>
                ))}
              </div>
            </div>
          )}

          {/* Mode Selection */}
          {mode !== 'condition' && (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 mb-6">
              <div className="flex gap-4">
                <button onClick={() => setMode('single')} className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg transition-all ${mode === 'single' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>
                  <Radio className="w-6 h-6" />
                  <span className="font-medium">Einzelne Frequenz</span>
                </button>
                <button onClick={() => setMode('sequence')} className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg transition-all ${mode === 'sequence' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>
                  <ListOrdered className="w-6 h-6" />
                  <span className="font-medium">Sequenz</span>
                </button>
              </div>
            </div>
          )}

          {/* Wave Visualization */}
          <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">Wellenform</h3>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setWaveType('sine')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${waveType === 'sine' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Sinus</button>
                <button onClick={() => setWaveType('square')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${waveType === 'square' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Rechteck</button>
                <button onClick={() => setWaveType('sawtooth')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${waveType === 'sawtooth' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Sägezahn</button>
                <button onClick={() => setWaveType('triangle')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${waveType === 'triangle' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Dreieck</button>
              </div>
            </div>
            <canvas ref={canvasRef} width={800} height={200} className="w-full bg-black/20 rounded-lg" />
          </div>

          {/* Selection */}
          {mode === 'single' && (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-bold text-white">
                  Frequenzen auswählen
                  {selectedPerson && <span className="text-muted-foreground text-sm ml-2">({displayFrequencies.length} zugeordnet)</span>}
                </h2>
                <button
                  onClick={() => navigate('/frequencies')}
                  className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg px-4 py-2 text-sm font-medium transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Neue Frequenz
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {displayFrequencies.map(freq => (
                  <label key={freq.id} className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${selectedFrequencyIds.includes(freq.id!) ? 'bg-primary/20 border-2 border-primary' : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'}`}>
                    <input type="checkbox" checked={selectedFrequencyIds.includes(freq.id!)} onChange={() => handleToggleFrequency(freq.id!)} className="w-5 h-5" />
                    <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: freq.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{freq.name}</p>
                      <p className="text-primary font-mono text-sm">{freq.hz} Hz</p>
                    </div>
                  </label>
                ))}
                {displayFrequencies.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">{selectedPerson ? 'Dieser Person sind noch keine Frequenzen zugeordnet' : 'Keine Frequenzen verfügbar'}</p>}
              </div>
            </div>
          )}

          {mode === 'sequence' && (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-bold text-white">
                  Sequenzen auswählen
                  {selectedPerson && <span className="text-muted-foreground text-sm ml-2">({displaySequences.length} zugeordnet)</span>}
                </h2>
                <button
                  onClick={() => navigate('/sequences')}
                  className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg px-4 py-2 text-sm font-medium transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Neue Sequenz
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {displaySequences.map(seq => (
                  <label key={seq.id} className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${selectedSequenceIds.includes(seq.id!) ? 'bg-primary/20 border-2 border-primary' : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'}`}>
                    <input type="checkbox" checked={selectedSequenceIds.includes(seq.id!)} onChange={() => handleToggleSequence(seq.id!)} className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{seq.name}</p>
                      <p className="text-muted-foreground text-sm">{seq.frequencies?.length || 0} Frequenzen</p>
                    </div>
                  </label>
                ))}
                {displaySequences.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">{selectedPerson ? 'Dieser Person sind noch keine Sequenzen zugeordnet' : 'Keine Sequenzen verfügbar'}</p>}
              </div>
            </div>
          )}

          {/* Condition Frequency List */}
          {mode === 'condition' && conditionFrequencies.length > 0 && (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-heading font-bold text-white mb-4">Frequenzen in diesem Anwendungsgebiet</h2>
              <div className="space-y-2">
                {conditionFrequencies.map((freq, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      isPlaying && currentFrequencyIndex === index
                        ? 'bg-primary/20 border border-primary'
                        : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground font-mono text-sm w-6">{index + 1}.</span>
                      <p className="text-white font-mono font-medium">{freq.hz} Hz</p>
                    </div>
                    <p className="text-muted-foreground text-sm">{formatTime(freq.duration)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player Controls */}
          <div className="backdrop-blur-md bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20 rounded-xl p-8">
            {isPlaying && (
              <div className="text-center mb-6">
                <p className="text-muted-foreground text-sm mb-1">Spielt ab:</p>
                <p className="text-white text-xl font-heading font-bold">{getCurrentFrequencyName()}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-6 mb-8">
              <button 
                onClick={handlePlayPause} 
                disabled={
                  (mode === 'single' && selectedFrequencyIds.length === 0) || 
                  (mode === 'sequence' && selectedSequenceIds.length === 0) ||
                  (mode === 'condition' && conditionFrequencies.length === 0)
                } 
                className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlaying ? <Pause className="w-10 h-10 text-white" /> : <Play className="w-10 h-10 text-white ml-1" />}
              </button>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${(currentTime / duration) * 100}%` }} />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Volume2 className="w-5 h-5 text-white" />
              <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="flex-1" />
              <span className="text-white font-medium w-12">{volume}%</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
