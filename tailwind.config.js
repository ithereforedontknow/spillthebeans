/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"Geist"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        base:   '#f2f4ef',
        raised: '#e8ece3',
        card:   '#dfe5d8',
        border: '#c8d4be',
        muted:  '#a8b99a',
        dim:    '#718264',
        body:   '#3d4a35',
        head:   '#1a2314',
        // grass green accent
        amber: {
          DEFAULT: '#4a7c3f',
          dim:     '#2e5227',
          bright:  '#5e9e52',
          subtle:  '#eaf2e7',
        },
      },
      borderRadius: {
        sm:  '2px',
        DEFAULT: '3px',
        md:  '5px',
        lg:  '8px',
        xl:  '12px',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.06em' }],
      },
      animation: {
        'fade-up': 'fadeUp 0.35s ease-out both',
        'fade-in': 'fadeIn 0.25s ease-out both',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
