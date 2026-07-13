/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── TaskFlow Dark Theme ──────────────────────────
        primary: {
          DEFAULT: '#6366f1',
          hover:   '#4f46e5',
          light:   '#818cf8',
        },
        dark: {
          bg:      '#0d0f14',
          sidebar: '#13151c',
          card:    '#1a1d27',
          border:  '#2a2d3e',
          hover:   '#1e2130',
          input:   '#1e2130',
        },
        text: {
          primary:   '#ffffff',
          secondary: '#94a3b8',
          muted:     '#64748b',
        },
        status: {
          backlog:    '#64748b',
          todo:       '#3b82f6',
          inprogress: '#f59e0b',
          review:     '#8b5cf6',
          done:       '#10b981',
        },
        priority: {
          low:      '#10b981',
          medium:   '#f59e0b',
          high:     '#f97316',
          critical: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg:      '0.75rem',
        xl:      '1rem',
      },
      boxShadow: {
        card:  '0 4px 6px -1px rgba(0,0,0,0.3)',
        modal: '0 25px 50px -12px rgba(0,0,0,0.8)',
      },
    },
  },
  plugins: [],
}