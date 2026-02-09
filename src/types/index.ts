export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
}

export interface Frequency {
  id: string;
  hz: number;
  name: string;
  description: string;
  conditions: string[]; // Array of condition IDs
  is_predefined: boolean;
  color?: string; // Optional hex color (e.g. "#FF0000")
  created_at: Date;
  created_by?: string; // User ID
}

export interface Condition {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: Date;
}

export interface Person {
  id: string;
  name: string;
  email?: string;
  notes?: string;
  conditions: string[]; // Array of condition IDs
  assigned_frequencies: string[]; // Array of frequency IDs
  created_at: Date;
  created_by: string; // User ID
}

export interface SequenceFrequency {
  hz: number;
  duration: number; // in seconds
  frequency_id?: string;
}

export interface Sequence {
  id: string;
  name: string;
  frequencies: SequenceFrequency[];
  created_by: string; // User ID
  created_at: Date;
}

export interface PersonSequence {
  id: string;
  person_id: string;
  sequence_id: string;
  created_at: Date;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentFrequency: number | null;
  currentDuration: number;
  progress: number;
  volume: number;
}

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';
