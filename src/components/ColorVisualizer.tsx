import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import type { Frequency } from '@/types';

interface ColorVisualizerProps {
  frequency: number | null;
  isPlaying: boolean;
  className?: string;
}

// Default Chakra frequency to color mapping
const DEFAULT_FREQUENCY_COLORS: Record<number, string> = {
  396: '#FF0000',  // Red
  417: '#FF8000',  // Orange
  528: '#FFFF00',  // Yellow
  639: '#00FF00',  // Green
  741: '#0000FF',  // Blue
  852: '#4B0082',  // Indigo
  963: '#9400D3',  // Violet
};

const DEFAULT_COLOR = '#FFFFFF'; // White for other frequencies

export function ColorVisualizer({ frequency, isPlaying, className = '' }: ColorVisualizerProps) {
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [pulse, setPulse] = useState(false);
  const [customColors, setCustomColors] = useState<Record<number, string>>({});

  // Load custom colors from database
  useEffect(() => {
    loadCustomColors();
  }, []);

  const loadCustomColors = async () => {
    const frequencies = await db.getAll('frequencies');
    const colorMap: Record<number, string> = {};
    frequencies.forEach((freq: Frequency) => {
      if (freq.color) {
        colorMap[freq.hz] = freq.color;
      }
    });
    setCustomColors(colorMap);
  };

  const getColorForFrequency = (hz: number | null): string => {
    if (!hz) return DEFAULT_COLOR;
    
    // Check custom colors first (from database)
    if (customColors[hz]) {
      return customColors[hz];
    }
    
    // Check exact matches in default colors
    if (DEFAULT_FREQUENCY_COLORS[hz]) {
      return DEFAULT_FREQUENCY_COLORS[hz];
    }
    
    // Find closest frequency (within 10 Hz tolerance)
    const allColors = { ...DEFAULT_FREQUENCY_COLORS, ...customColors };
    const frequencies = Object.keys(allColors).map(Number);
    const closest = frequencies.find(f => Math.abs(f - hz) <= 10);
    
    if (closest) {
      return allColors[closest];
    }
    
    return DEFAULT_COLOR;
  };

  useEffect(() => {
    if (isPlaying && frequency) {
      setColor(getColorForFrequency(frequency));
      setPulse(true);
    } else {
      setColor(DEFAULT_COLOR);
      setPulse(false);
    }
  }, [frequency, isPlaying, customColors]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 ${className}`}>
      {/* Color Display */}
      <div
        className={`w-full h-full transition-all duration-500 ${pulse ? 'animate-pulse-slow' : ''}`}
        style={{
          backgroundColor: color,
          boxShadow: isPlaying ? `0 0 40px ${color}` : 'none',
        }}
      >
        {/* Info Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
          {isPlaying && frequency ? (
            <>
              <div className="text-4xl font-heading font-bold text-white drop-shadow-lg mb-2">
                {frequency} Hz
              </div>
              <div className="text-sm text-white/80 font-medium uppercase tracking-wider">
                Color Active
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">
              No frequency playing
            </div>
          )}
        </div>
      </div>

      {/* Color Legend (bottom) */}
      {!isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
          <div className="text-xs text-muted-foreground text-center">
            <p className="mb-3 font-medium text-white">Frequency Colors:</p>
            <div className="flex justify-center gap-3 flex-wrap max-h-24 overflow-y-auto">
              {Object.entries({ ...DEFAULT_FREQUENCY_COLORS, ...customColors }).map(([freq, col]) => (
                <div key={freq} className="flex items-center gap-1.5 bg-black/40 rounded-full px-3 py-1.5 border border-white/10">
                  <div
                    className="w-3 h-3 rounded-full border border-white/30 shadow-lg"
                    style={{ backgroundColor: col, boxShadow: `0 0 8px ${col}` }}
                  />
                  <span className="text-white font-mono">{freq}Hz</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
