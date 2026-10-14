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
        'background-dark': '#090a0c',
        'text-light': '#0f172a',
        'text-dark': '#f8fafc',
        'text-subtle-light': '#64748b',
        'text-subtle-dark': '#94a3b8',
        'surface-light': '#ffffff',
        'surface-dark': '#121316',
        'border-light': '#e2e8f0',
        'border-dark': 'rgba(255, 255, 255, 0.08)',
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
