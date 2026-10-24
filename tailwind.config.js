/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': 'var(--color-primary)',
        'background-light': '#f8fafc',
        'background-dark': '#141416', // Antigravity Matte Dark Gray Canvas
        'text-light': '#0f172a',
        'text-dark': '#ffffff',
        'text-subtle-light': '#64748b',
        'text-subtle-dark': '#9ca3af', // Antigravity Muted Text Gray
        'surface-light': '#ffffff',
        'surface-dark': '#1e1f24', // Antigravity Panel & Card Surface Gray
        'surface-dark-elevated': '#26272e', // Antigravity Elevated Card Gray
        'border-light': '#e2e8f0',
        'border-dark': 'rgba(255, 255, 255, 0.09)', // Antigravity Refined Border Gray
        // Electric Blue Accent from AccountsMan
        'electric-blue': {
          DEFAULT: '#2563eb',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#081636',
        },
        // Golden Cinema / Hollywood Amber palette
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24', // Studio Spotlight Amber
          500: '#F59E0B', // Signature Golden Cinema Amber
          600: '#D97706', // Deep Gold / Trophy Amber
          700: '#B45309', // Warm Bronze
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
      },
      fontFamily: {
        'display': ['Plus Jakarta Sans', 'Spline Sans', '-apple-system', 'sans-serif'],
        'sans': ['Plus Jakarta Sans', '-apple-system', 'sans-serif'],
        'serif': ['Newsreader', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
