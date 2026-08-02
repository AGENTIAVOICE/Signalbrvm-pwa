/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#F5C842',
        primaryDark: '#D4A82E',
        secondary: '#1A1A1A',
        buy: '#22C55E',
        sell: '#EF4444',
        neutral: '#94A3B8',
        bg: '#0A0A0F',
        surface: '#111118',
        surface2: '#1A1A24',
        surface3: '#222230',
        border: '#2A2A3A',
        borderLight: '#3A3A4A',
        textSub: '#8A8A9A',
        textMuted: '#4A4A5A',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
    },
  },
  plugins: [],
}
