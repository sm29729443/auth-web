/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'chinese': ['Microsoft JhengHei', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'bounce-in': 'bounceIn 0.6s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'check-mark': 'checkMark 0.5s ease-out 0.8s forwards',
      },
      keyframes: {
        bounceIn: {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.3) translateY(30px)' 
          },
          '50%': { 
            opacity: '1', 
            transform: 'scale(1.05) translateY(-10px)' 
          },
          '70%': { 
            transform: 'scale(0.9) translateY(0)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1) translateY(0)' 
          },
        },
        fadeIn: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(20px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        slideUp: {
          '0%': { 
            transform: 'translateY(100%)' 
          },
          '100%': { 
            transform: 'translateY(0)' 
          },
        },
        checkMark: {
          '0%': { 
            'stroke-dasharray': '0 100' 
          },
          '100%': { 
            'stroke-dasharray': '100 0' 
          },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'inner-lg': 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
      },
    },
  },
  plugins: [],
}
