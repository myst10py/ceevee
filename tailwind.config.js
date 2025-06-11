/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./renderer.js",
    "./components/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        // macOS-inspired colors
        'macos-bg': 'rgba(30, 30, 30, 0.85)',
        'macos-bg-light': 'rgba(255, 255, 255, 0.85)',
        'macos-selection': 'rgba(0, 122, 255, 0.2)',
      },
      backdropBlur: {
        'macos': '40px',
      },
      animation: {
        'in': 'in 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'out': 'out 100ms ease-out',
        'fade-in': 'fade-in 150ms ease-out',
        'fade-out': 'fade-out 100ms ease-out',
        'slide-in-from-top': 'slide-in-from-top 200ms ease-out',
        'slide-out-to-left': 'slide-out-to-left 200ms ease-out',
      },
      keyframes: {
        in: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        out: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-out-to-left': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-16px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}