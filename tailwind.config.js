/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'rgb(var(--color-bg) / <alpha-value>)',
          soft: 'rgb(var(--color-bg-soft) / <alpha-value>)',
          card: 'rgb(var(--color-bg-card) / <alpha-value>)',
          hover: 'rgb(var(--color-bg-hover) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          soft: 'rgb(var(--color-border-soft) / <alpha-value>)',
        },
        text: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          dim: 'rgb(var(--color-text-dim) / <alpha-value>)',
        },
        brand: {
          50: '#eef4ff',
          100: '#d9e5ff',
          200: '#bccfff',
          300: '#8fadff',
          400: '#6485ff',
          500: '#4360f5',
          600: '#3246d8',
          700: '#2935ad',
          800: '#232d89',
          900: '#1f2970',
        },
        accent: {
          rose: '#f43f6e',
          amber: '#f59e0b',
          emerald: '#10b981',
          violet: '#8b5cf6',
          sky: '#0ea5e9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.25)',
        glow: '0 0 0 1px rgba(67,96,245,0.35), 0 10px 40px -10px rgba(67,96,245,0.35)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(128,128,128,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.06) 1px, transparent 1px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
