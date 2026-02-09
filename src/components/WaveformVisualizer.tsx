import { useEffect, useRef } from 'react';
import { audioService } from '@/lib/audio';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  frequency?: number;
  className?: string;
}

export function WaveformVisualizer({ isPlaying, frequency, className = '' }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
      ctx.fillRect(0, 0, width, height);

      if (isPlaying) {
        const dataArray = audioService.getAnalyserData();
        if (dataArray) {
          const bufferLength = dataArray.length;
          const sliceWidth = width / bufferLength;

          // Create gradient
          const gradient = ctx.createLinearGradient(0, 0, width, 0);
          gradient.addColorStop(0, '#6366f1');
          gradient.addColorStop(0.5, '#06b6d4');
          gradient.addColorStop(1, '#6366f1');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#6366f1';

          ctx.beginPath();

          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.lineTo(width, height / 2);
          ctx.stroke();

          // Draw frequency label
          if (frequency) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 48px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${frequency} Hz`, width / 2, height / 2 + 60);
          }
        }
      } else {
        // Idle state - flat line with pulse
        const centerY = height / 2;
        const pulse = Math.sin(Date.now() / 1000) * 5;

        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY + pulse);
        ctx.lineTo(width, centerY + pulse);
        ctx.stroke();

        // "Ready" text
        ctx.fillStyle = 'rgba(161, 161, 170, 0.6)';
        ctx.font = '24px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Ready to Play', width / 2, centerY - 40);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, frequency]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}
