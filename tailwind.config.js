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
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
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
        },
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
