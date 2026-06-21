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
        // Proteínas — cor semântica de cada tipo (badges, acentos, rankings).
        // Antes espalhadas como hex cru em vários componentes; agora token único.
        bovina: { DEFAULT: '#8a3b34', claro: '#e0867c' },
        frango: { DEFAULT: '#b07c1e', claro: '#e3b45c', escuro: '#9a6c17' },
        suina:  { DEFAULT: '#b05a7e', claro: '#dd92b4', escuro: '#9c4a6c' },
        peixe:  { DEFAULT: '#2d6f8e', claro: '#7cb8d4' },
        ovo:    { DEFAULT: '#c8a96b', claro: '#dcc492' },
        // Estados semânticos — perigo / alerta / info (mapeiam os hex repetidos).
        perigo: { DEFAULT: '#b04c41', escuro: '#9b4038', claro: '#e89a90' },
        alerta: { DEFAULT: '#d18a3a', escuro: '#bd7a2f', claro: '#e3b45c' },
        info:   { DEFAULT: '#2d6f8e', claro: '#7cb8d4' },
        // Tokens semânticos (mapeados às CSS vars em globals.css)
        superficie: 'rgb(var(--superficie) / <alpha-value>)',
        'superficie-2': 'rgb(var(--superficie-2) / <alpha-value>)',
        linha: 'rgb(var(--linha) / <alpha-value>)',
        texto: 'rgb(var(--texto) / <alpha-value>)',
        'texto-suave': 'rgb(var(--texto-suave) / <alpha-value>)',
      },
      // Escala tipográfica fechada — 6 papéis. Substitui os ~10 tamanhos
      // ad-hoc em px espalhados pelas telas. Cada um carrega tamanho + leading.
      fontSize: {
        caption: ['11px', { lineHeight: '1.4' }],
        rotulo: ['12px', { lineHeight: '1.4' }],
        corpo: ['14px', { lineHeight: '1.5' }],
        subtitulo: ['15px', { lineHeight: '1.45' }],
        titulo: ['19px', { lineHeight: '1.25' }],
        heroi: ['28px', { lineHeight: '1.05' }],
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
        deslizar: {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        brilho: {
          '100%': { transform: 'translateX(100%)' },
        },
        estourar: {
          '0%': { opacity: '0', transform: 'scale(.6)' },
          '60%': { opacity: '1', transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
        confete: {
          to: { transform: 'translate(var(--tx, 0), -120px) rotate(540deg)', opacity: '0' },
        },
      },
      animation: {
        subir: 'subir .28s cubic-bezier(.21,.8,.35,1) both',
        aparecer: 'aparecer .2s ease-out both',
        deslizar: 'deslizar .3s cubic-bezier(.21,.8,.35,1) both',
        brilho: 'brilho 1.4s infinite',
        estourar: 'estourar .42s cubic-bezier(.21,.8,.35,1) both',
        confete: 'confete .9s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
