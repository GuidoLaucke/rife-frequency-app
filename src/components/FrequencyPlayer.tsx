import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { ColorVisualizer } from './ColorVisualizer';
import { audioService } from '@/lib/audio';
import type { WaveformType, SequenceFrequency } from '@/types';

interface FrequencyPlayerProps {
  sequence?: SequenceFrequency[];
  singleFrequency?: number;
  singleDuration?: number;
  onComplete?: () => void;
}

export function FrequencyPlayer({
  sequence,
  singleFrequency,
  singleDuration = 180,
  onComplete,
}: FrequencyPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [waveform, setWaveform] = useState<WaveformType>('sine');
  
  const intervalRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const frequencies = sequence || (singleFrequency ? [{ hz: singleFrequency, duration: singleDuration }] : []);
  const currentFreq = frequencies[currentIndex];
  const totalDuration = currentFreq?.duration || 0;

  useEffect(() => {
    audioService.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  useEffect(() => {
    // Only play if explicitly playing AND we have a frequency
    if (isPlaying && currentFreq) {
      audioService.playFrequency(currentFreq.hz, waveform);
      startTimeRef.current = Date.now();

      intervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const progress = (elapsed / totalDuration) * 100;

        if (progress >= 100) {
          // Move to next frequency or stop
          if (currentIndex < frequencies.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
          } else {
            handleStop();
            onComplete?.();
          }
        } else {
          setProgress(progress);
        }
      }, 100);
    } else {
      // Not playing - ensure audio is stopped
      audioService.stop();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, waveform]); // Removed currentFreq and totalDuration from dependencies

  const handlePlayPause = async () => {
    if (!currentFreq) return;

    if (isPlaying) {
      audioService.stop();
      setIsPlaying(false);
    } else {
      await audioService.initialize();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    audioService.stop();
    setIsPlaying(false);
    setCurrentIndex(0);
    setProgress(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const elapsed = (progress / 100) * totalDuration;
  const remaining = totalDuration - elapsed;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/5 to-transparent p-1 border border-white/10">
      {/* Main Player Card */}
      <div className="relative backdrop-blur-2xl bg-black/40 rounded-xl p-8">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

        {/* Waveform Visualizer */}
        <div className="relative h-64 mb-8 rounded-xl overflow-hidden border border-white/5 bg-black/20">
          <WaveformVisualizer
            isPlaying={isPlaying}
            frequency={currentFreq?.hz}
          />
        </div>

        {/* Color Visualizer */}
        <ColorVisualizer
          frequency={currentFreq?.hz}
          isPlaying={isPlaying}
          className="h-48 mb-6"
        />

        {/* Frequency Info */}
        <div className="text-center mb-6">
          {sequence && (
            <p className="text-sm text-muted-foreground mb-2">
              Frequency {currentIndex + 1} of {frequencies.length}
            </p>
          )}
          <h3 className="text-4xl font-heading font-bold text-white mb-2">
            {currentFreq?.hz || '—'} <span className="text-accent">Hz</span>
          </h3>
          <p className="text-muted-foreground">
            {formatTime(elapsed)} / {formatTime(totalDuration)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-active-frequency transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{formatTime(elapsed)}</span>
            <span>-{formatTime(remaining)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={handlePlayPause}
            disabled={!currentFreq}
            className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>

          {isPlaying && (
            <button
              onClick={handleStop}
              className="px-6 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-white border border-white/5 transition-all"
            >
              Stop
            </button>
          )}
        </div>

        {/* Volume & Waveform Controls */}
        <div className="flex items-center justify-between gap-6 pt-6 border-t border-white/5">
          {/* Volume */}
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={(e) => {
                const newVolume = parseInt(e.target.value) / 100;
                setVolume(newVolume);
                if (newVolume > 0) setIsMuted(false);
              }}
              className="flex-1 h-2 bg-white/5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Waveform Type */}
          <div className="flex gap-2">
            {(['sine', 'square', 'triangle', 'sawtooth'] as WaveformType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setWaveform(type);
                  if (isPlaying && currentFreq) {
                    audioService.setWaveform(type);
                  }
                }}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  waveform === type
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
