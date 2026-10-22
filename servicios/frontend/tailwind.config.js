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
        ink: '#22343A',
        suave: '#5a6b70',
        brand: {
          DEFAULT: '#35858E',
          dark: '#276169',
        },
        // El marco de la app: un paso de tono del verde de la marca; la hoja de trabajo queda en blanco.
        marco: '#eef3f2',
        borde: '#e4eae9',
        linea: '#cfd4d8',
        ok: '#2e7d32',
        alerta: '#b45309',
        falla: '#c62828',
      },
    },
  },
  plugins: [],
}
