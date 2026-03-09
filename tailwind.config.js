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
        base:   '#0c0b09',
        raised: '#131210',
        card:   '#1a1814',
        border: '#272420',
        muted:  '#332f29',
        dim:    '#7a7268',
        body:   '#c8c3b8',
        head:   '#edeae3',
        // single accent
        amber: {
          DEFAULT: '#f0a500',
          dim:     '#7a5400',
          bright:  '#fbbf24',
          subtle:  '#1c1508',
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
