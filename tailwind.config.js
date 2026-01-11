/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0a0a0a',
        'brand-gray': '#1f1f1f',
        'brand-accent': '#3b82f6',
      }
    },
  },
  plugins: [],
}
