/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B2C',
          dark: '#FF4F00',
          light: '#FF8A54'
        },
        background: {
          DEFAULT: '#ffffff',
          dark: '#0A0A0B'
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#141416'
        },
        'text-primary': {
          DEFAULT: '#1A1A1A',
          dark: '#FFFFFF'
        },
        'text-secondary': {
          DEFAULT: '#666666',
          dark: '#A1A1AA'
        }
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(45deg, #0A0A0B, #1A1A1A)',
        'gradient-primary': 'linear-gradient(45deg, #FF6B2C, #FF8A54)',
        'gradient-card-dark': 'linear-gradient(180deg, rgba(255, 107, 44, 0.1), rgba(20, 20, 22, 0))',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 107, 44, 0.15)',
        'card-dark': '0 8px 16px rgba(0, 0, 0, 0.2)'
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 6s ease-in-out infinite'
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
} 