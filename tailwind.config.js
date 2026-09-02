/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cad: {
          bg: '#0f141c',
          grid: '#1e293b',
          gridSub: '#151e2e',
          canvas: '#131924',
          wall: '#334155',
          wallFill: '#1e293b',
          accent: '#38bdf8',
          accentHover: '#0ea5e9',
          border: '#334155',
          panel: '#182234',
          panelHover: '#1f2d42',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
