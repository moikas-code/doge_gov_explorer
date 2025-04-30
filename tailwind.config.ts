import type { Config } from 'tailwindcss'
import { nextui } from '@nextui-org/react'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'kawaii-pink': '#FF69B4',
        'sakura': '#FFB7C5',
        'anime-blue': '#7BD3EA',
        'neon-purple': '#9D4EDD',
        'pastel-yellow': '#FFF3B0',
        'manga-gray': '#2D3748',
        'otaku-dark': '#1A1B26',
        'accent-cyan': '#73FBD3',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'kawaii-gradient': 'linear-gradient(135deg, #FF69B4 0%, #73FBD3 100%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        dark: {
          colors: {
            background: '#1A1B26',
            foreground: '#FFFFFF',
            primary: {
              DEFAULT: '#FF69B4',
              foreground: '#FFFFFF',
            },
            secondary: {
              DEFAULT: '#73FBD3',
              foreground: '#1A1B26',
            },
            focus: '#9D4EDD',
          },
        },
        light: {
          colors: {
            background: '#FFFFFF',
            foreground: '#1A1B26',
            primary: {
              DEFAULT: '#FF69B4',
              foreground: '#FFFFFF',
            },
            secondary: {
              DEFAULT: '#73FBD3',
              foreground: '#1A1B26',
            },
            focus: '#9D4EDD',
          },
        },
      },
    }),
  ],
}
export default config 