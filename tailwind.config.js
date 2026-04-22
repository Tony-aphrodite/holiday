/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0b0d12',
          soft: '#11141b',
          card: '#151924',
          hover: '#1b2030',
        },
        border: {
          DEFAULT: '#232836',
          soft: '#1a1e2a',
        },
        text: {
          DEFAULT: '#e6e8ec',
          muted: '#8b92a7',
          dim: '#5c6377',
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
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.4)',
        glow: '0 0 0 1px rgba(67,96,245,0.35), 0 10px 40px -10px rgba(67,96,245,0.35)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
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
