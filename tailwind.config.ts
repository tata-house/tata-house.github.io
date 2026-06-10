import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verde do logo TATÁ Sushi
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
      },
    },
  },
  plugins: [],
};

export default config;
