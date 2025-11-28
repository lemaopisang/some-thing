import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        brand: {
          400: '#6ff2c5',
          500: '#34d399',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(52, 211, 153, 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
