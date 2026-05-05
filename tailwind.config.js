/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0a14',
          soft: '#10101c',
          card: 'rgba(255,255,255,0.04)'
        },
        accent: {
          DEFAULT: '#7c5cff',
          alt: '#22d3ee',
          warm: '#fb7185',
          gold: '#fbbf24'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        glow: '0 0 40px rgba(124,92,255,0.25)',
        'glow-cyan': '0 0 40px rgba(34,211,238,0.25)'
      }
    }
  },
  plugins: []
};
