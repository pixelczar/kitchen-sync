/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: '#F7EA31',
        red: '#F7313F',
        blue: '#0A95FF',
        purple: '#3C0E4D',
        green: '#10B981',
        cream: '#FAF8F3',
        charcoal: '#2D3748',
        'gray-light': '#E0E0E0',
        'gray-medium': '#9CA3AF',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Work Sans', 'sans-serif'],
        handwritten: ['Permanent Marker', 'cursive'],
      },
      fontWeight: {
        semibold: '600',
        bold: '700',
        black: '900',
      },
    },
  },
  plugins: [],
}

