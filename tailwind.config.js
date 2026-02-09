/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        foreground: '#f8fafc',
        card: {
          DEFAULT: 'rgba(20, 20, 25, 0.6)',
          foreground: '#f8fafc',
        },
        popover: {
          DEFAULT: '#0a0a0a',
          foreground: '#f8fafc',
        },
        primary: {
          DEFAULT: '#6366f1',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#1e1e24',
          foreground: '#e2e8f0',
        },
        muted: {
          DEFAULT: '#27272a',
          foreground: '#a1a1aa',
        },
        accent: {
          DEFAULT: '#06b6d4',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        input: 'rgba(255, 255, 255, 0.05)',
        ring: '#6366f1',
      },
      fontFamily: {
        sans: ['Figtree', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, rgba(5, 5, 5, 0) 70%)',
        'active-frequency': 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
        'glass-surface': 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
