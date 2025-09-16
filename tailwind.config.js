/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'swing': 'swing 2s ease-in-out infinite',
        'wobble': 'wobble 0.5s ease-in-out',
        'fall': 'fall 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'paper-flip': 'paper-flip 0.6s ease-in-out',
        'tack-press': 'tack-press 0.2s ease-in-out',
      },
      keyframes: {
        swing: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        wobble: {
          '0%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        fall: {
          '0%': {
            transform: 'translateY(-100vh) rotate(0deg)',
            opacity: '0'
          },
          '50%': {
            transform: 'translateY(0) rotate(180deg)',
            opacity: '1'
          },
          '75%': {
            transform: 'translateY(10px) rotate(270deg)',
          },
          '100%': {
            transform: 'translateY(0) rotate(360deg)',
            opacity: '1'
          },
        },
        'bounce-in': {
          '0%': {
            transform: 'scale(0) rotate(-180deg)',
            opacity: '0'
          },
          '50%': {
            transform: 'scale(1.1) rotate(10deg)',
            opacity: '1'
          },
          '100%': {
            transform: 'scale(1) rotate(0deg)',
            opacity: '1'
          },
        },
        'paper-flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        'tack-press': {
          '0%, 100%': { transform: 'translateZ(0) scale(1)' },
          '50%': { transform: 'translateZ(-10px) scale(0.95)' },
        },
      },
      boxShadow: {
        'paper': '2px 2px 10px rgba(0, 0, 0, 0.1), 0 0 40px rgba(0, 0, 0, 0.05) inset',
        'paper-hover': '4px 4px 20px rgba(0, 0, 0, 0.15), 0 0 40px rgba(0, 0, 0, 0.05) inset',
        'tack': '2px 2px 4px rgba(0, 0, 0, 0.3), inset -1px -1px 2px rgba(0, 0, 0, 0.2)',
        'tack-hover': '3px 3px 6px rgba(0, 0, 0, 0.4), inset -1px -1px 2px rgba(0, 0, 0, 0.2)',
      },
      backgroundImage: {
        'cork': "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"%3E%3Crect width=\"100\" height=\"100\" fill=\"%23D4A574\"%2F%3E%3Cg fill=\"%23C19552\" opacity=\"0.3\"%3E%3Ccircle cx=\"20\" cy=\"20\" r=\"2\"%2F%3E%3Ccircle cx=\"60\" cy=\"40\" r=\"1.5\"%2F%3E%3Ccircle cx=\"80\" cy=\"80\" r=\"2.5\"%2F%3E%3Ccircle cx=\"30\" cy=\"70\" r=\"1\"%2F%3E%3Ccircle cx=\"90\" cy=\"30\" r=\"1.8\"%2F%3E%3C%2Fg%3E%3Cg fill=\"%23A0845C\" opacity=\"0.2\"%3E%3Crect x=\"15\" y=\"50\" width=\"3\" height=\"8\" rx=\"1\"%2F%3E%3Crect x=\"45\" y=\"20\" width=\"4\" height=\"6\" rx=\"1\"%2F%3E%3Crect x=\"70\" y=\"60\" width=\"3\" height=\"7\" rx=\"1\"%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')",
      },
    },
  },
  plugins: [],
}