import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#c94625',
        accent: '#fdc939',
        cream: '#fde8c8'
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Noto Sans TC"',
          '"Segoe UI"', 'Roboto', 'sans-serif'
        ]
      }
    }
  },
  plugins: []
} satisfies Config;
