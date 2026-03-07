import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-primary': '#090909',
        'bg-surface': '#111111',
        'bg-elevated': '#1a1a1a',
        'border-col': '#222222',
        'text-primary': '#f0f0f0',
        'text-secondary': '#888888',
        'text-muted': '#3a3a3a',
        'accent-mastercard': '#EB5757',
        'accent-user': '#74B9FF',
        'accent-agent': '#A29BFE',
        'accent-merchant': '#55EFC4',
        'accent-network': '#6C5CE7',
        'syn-key': '#A29BFE',
        'syn-string': '#55EFC4',
        'syn-number': '#FD9644',
        'syn-boolean': '#74B9FF',
        'syn-hash': '#636E72',
      },
    },
  },
  plugins: [],
} satisfies Config
