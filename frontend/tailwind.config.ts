import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        nx: {
          'bg-base': '#080B12',
          'bg-surface': '#0D1117',
          'bg-elevated': '#161B22',
          'bg-overlay': '#1C2333',
          border: '#21262D',
          'border-subtle': '#161B22',
          cyan: '#39D0D8',
          'cyan-dim': 'rgba(57,208,216,0.12)',
          violet: '#8B5CF6',
          'violet-dim': 'rgba(139,92,246,0.12)',
          amber: '#F59E0B',
          'amber-dim': 'rgba(245,158,11,0.1)',
          green: '#22C55E',
          'green-dim': 'rgba(34,197,94,0.1)',
          red: '#EF4444',
          'red-dim': 'rgba(239,68,68,0.1)',
          'text-primary': '#E6EDF3',
          'text-secondary': '#8B949E',
          'text-muted': '#484F58',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
