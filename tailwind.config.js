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
        // Màu sắc Đoàn Thanh Niên (Emerald)
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
          DEFAULT: '#10b981', // Add DEFAULT for easier bg-primary usage
        },
        doan: {
          green: '#0B6E4F',
          red: '#DA251D',
          yellow: '#F59E0B',
        },
        // Dark mode background colors
        dark: {
          card: '#1f2937',
          bg: '#111827',
          border: '#374151',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'premium': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 15px rgba(16, 185, 129, 0.3)',
      },
      keyframes: {
        'blink-border': {
          '0%, 100%': { borderColor: '#EF4444', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
          '50%': { borderColor: '#DC2626', boxShadow: '0 0 8px 2px rgba(239, 68, 68, 0.35)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'blink-border': 'blink-border 1.5s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}

