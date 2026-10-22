import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        ink: 'var(--ink)',
        suave: 'var(--suave)',
        brand: {
          DEFAULT: 'var(--brand)',
          dark: 'var(--brand-dark)',
          hondo: 'var(--brand-hondo)',
        },
        // Paleta definida en index.css (tinta nocturna con dorado); aquí solo se nombran los tokens.
        marco: 'var(--marco)',
        borde: 'var(--borde)',
        linea: '#cfd4d8',
        ok: '#2e7d32',
        alerta: '#b45309',
        falla: '#c62828',
      },
    },
  },
  plugins: [],
}
