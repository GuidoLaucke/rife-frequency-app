import type { WaveformType } from '@/types';

class FrequencyAudioService {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isInitialized = false;
  private targetVolume = 0.3; // Store target volume
  private fadeTime = 0.05; // 50ms fade (increased from 10ms)

  async initialize() {
    if (this.isInitialized) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();
    
    this.analyser.fftSize = 2048;
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    // Start at 0, will fade in when playing
    this.gainNode.gain.value = 0;
    this.isInitialized = true;
  }

  async playFrequency(hz: number, waveType: WaveformType = 'sine') {
    if (!this.isInitialized) await this.initialize();
    
    if (!this.audioContext || !this.gainNode) return;

    // Force stop any existing oscillator immediately
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        // Already stopped
      }
      this.oscillator = null;
    }

    // Reset gain to 0
    const now = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(0, now);

    // Create new oscillator
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = waveType;
    this.oscillator.frequency.setValueAtTime(hz, this.audioContext.currentTime);
    
    // Connect oscillator
    this.oscillator.connect(this.gainNode);
    
    // Start oscillator BEFORE fading in
    this.oscillator.start();
    
    // Fade-in from 0 to target volume (50ms)
    this.gainNode.gain.linearRampToValueAtTime(this.targetVolume, now + this.fadeTime);
  }

  async stopWithFade(): Promise<void> {
    if (!this.oscillator || !this.audioContext || !this.gainNode) {
      return;
    }

    try {
      const now = this.audioContext.currentTime;
      
      // Fade-out to 0 (50ms)
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(0, now + this.fadeTime);
      
      // Stop oscillator AFTER fade-out completes
      this.oscillator.stop(now + this.fadeTime + 0.01);
      
      // Wait for fade to complete
      await new Promise(resolve => setTimeout(resolve, (this.fadeTime + 0.01) * 1000));
      
      this.oscillator.disconnect();
    } catch (e) {
      // Already stopped
    }
    
    this.oscillator = null;
  }

  stop() {
    // Synchronous version for immediate stops
    if (this.oscillator && this.audioContext && this.gainNode) {
      try {
        const now = this.audioContext.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(0, now + this.fadeTime);
        this.oscillator.stop(now + this.fadeTime + 0.01);
        this.oscillator.disconnect();
      } catch (e) {
        // Already stopped
      }
      this.oscillator = null;
    }
  }

  setVolume(volume: number) {
    // Clamp between 0 and 1
    this.targetVolume = Math.max(0, Math.min(1, volume));
    
    if (this.gainNode && this.audioContext && this.oscillator) {
      // Smooth volume change
      const now = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(this.targetVolume, now + 0.1);
    }
  }

  setWaveform(type: WaveformType) {
    if (this.oscillator) {
      this.oscillator.type = type;
    }
  }

  getAnalyserData(): Uint8Array | null {
    if (!this.analyser) return null;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  isPlaying(): boolean {
    return this.oscillator !== null;
  }

  cleanup() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}

export const audioService = new FrequencyAudioService();
