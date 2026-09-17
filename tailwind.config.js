/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        library: {
          primary: '#4F46E5',
          primaryDark: '#4338CA',
          secondary: '#0F766E',
          accent: '#D97706',
          light: '#F3F4F6',
          dark: '#1F2937',
        },
      },
    },
  },
  plugins: [],
}
