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
        'background-dark': '#081636', // Deep Midnight Sapphire (AccountsMan)
        'text-light': '#0f172a',
        'text-dark': '#ffffff',
        'text-subtle-light': '#64748b',
        'text-subtle-dark': '#93c5fd', // Ice Blue Subtitle & Accent Text
        'surface-light': '#ffffff',
        'surface-dark': '#0e2452', // Sapphire Card Surface
        'surface-dark-elevated': '#122c64', // Elevated Floating Card
        'border-light': '#e2e8f0',
        'border-dark': 'rgba(96, 165, 250, 0.18)', // Luminous Sapphire Border
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
        // Iconic CNN Red & Editorial Newsroom palette
        amber: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#EF4444', // Alert Red
          500: '#CC0000', // Signature Iconic CNN Red
          600: '#B30000', // Authoritative CNN Crimson
          700: '#990000', // Deep Newsroom Red
          800: '#7F0000',
          900: '#450A0A',
          950: '#1F0404',
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
