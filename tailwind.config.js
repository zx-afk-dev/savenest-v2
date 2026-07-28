/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/pages/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // primary
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        mist: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
        },
        ink: {
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        display: ['var(--font-sora)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(37, 99, 235, 0.12)',
        'glass-lg': '0 20px 60px -10px rgba(37, 99, 235, 0.25)',
        'inner-glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.6' },
          '80%, 100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        walk: {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(25%) translateY(-4px)' },
          '50%': { transform: 'translateX(50%) translateY(0)' },
          '75%': { transform: 'translateX(75%) translateY(-4px)' },
          '100%': { transform: 'translateX(100%) translateY(0)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-6px) rotate(2deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        float: 'float 4s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite',
        bob: 'bob 0.6s ease-in-out infinite',
        walk: 'walk 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
