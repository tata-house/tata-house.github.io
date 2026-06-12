import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verde do logo TATÁ Sushi — acento de marca
        brand: {
          50: '#e9fbf0',
          100: '#c9f5da',
          200: '#96eab7',
          300: '#5cd98d',
          400: '#2cc468',
          500: '#00b14f',
          600: '#009443',
          700: '#007638',
          800: '#055d2f',
          900: '#064c29',
        },
        // Neutro quente "papel washi / areia" — fundos e superfícies
        areia: {
          50: '#faf8f4',
          100: '#f3efe7',
          200: '#e8e1d3',
          300: '#d8cdb8',
          400: '#bfae8e',
          500: '#a3906c',
        },
        // Grafite "carvão" — tinta, cabeçalho e ações principais
        carvao: {
          50: '#f5f6f7',
          100: '#e8eaec',
          200: '#d2d5da',
          300: '#aab0b9',
          400: '#7c828c',
          500: '#565c66',
          600: '#41454e',
          700: '#30343b',
          800: '#23262c',
          850: '#1b1e23',
          900: '#15171b',
          950: '#0e1013',
        },
        // Dourado discreto — detalhes premium
        ouro: {
          300: '#dcc492',
          400: '#c8a96b',
          500: '#b08d4f',
          600: '#92713a',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        display: ['var(--font-display)', 'Georgia', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        suave: '0 1px 2px rgba(14,16,19,.05), 0 4px 14px rgba(14,16,19,.06)',
        media: '0 2px 6px rgba(14,16,19,.08), 0 10px 28px rgba(14,16,19,.10)',
        flutuante: '0 10px 40px rgba(14,16,19,.22)',
      },
      keyframes: {
        subir: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        aparecer: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        subir: 'subir .28s cubic-bezier(.21,.8,.35,1) both',
        aparecer: 'aparecer .2s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
