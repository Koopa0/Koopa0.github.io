/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { opacity: '0.5' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.5' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.5s ease-out',
        glow: 'glow 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
      colors: {
        // Zed-inspired dark theme colors
        dark: {
          bg: {
            primary: '#0d0d0d',
            secondary: '#1a1a1a',
            tertiary: '#27272a',
          },
          text: {
            primary: '#fafafa',
            secondary: '#e4e4e7',
            tertiary: '#a1a1aa',
          },
        },
        // Light theme colors
        light: {
          bg: {
            primary: '#ffffff',
            secondary: '#fafafa',
            tertiary: '#f4f4f5',
          },
          text: {
            primary: '#18181b',
            secondary: '#3f3f46',
            tertiary: '#71717a',
          },
        },
        // Accent colors
        accent: {
          blue: '#3b82f6',
          'blue-dark': '#2563eb',
          purple: '#8b5cf6',
          'purple-dark': '#7c3aed',
        },
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glow-md': '0 0 30px rgba(59, 130, 246, 0.6)',
        'glow-lg': '0 0 45px rgba(59, 130, 246, 0.7)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-dark-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'sans-tc': ['Noto Sans TC', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: theme('colors.dark.text.primary'),
            a: {
              color: theme('colors.accent.blue'),
              '&:hover': {
                color: theme('colors.accent.blue-dark'),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [],
  // Optimize for production
  future: {
    hoverOnlyWhenSupported: true,
  },
}
