import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'wknd-yellow': '#f7c948',
        'wknd-black': '#202020',
        'wknd-gray': '#f4f4f4',
      },
      fontFamily: {
        sans: ['Asar', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
