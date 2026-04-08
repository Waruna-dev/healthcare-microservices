/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#3525cd', container: '#4f46e5', fixed: '#e2dfff' },
        secondary: { DEFAULT: '#006c49', container: '#6cf8bb', fixed: '#6ffbbe' },
        tertiary: { DEFAULT: '#7e3000', container: '#a44100' },
        error: { DEFAULT: '#ba1a1a', container: '#ffdad6' },
        background: '#f7f9fb',
        surface: {
          DEFAULT: '#f7f9fb', bright: '#ffffff', dim: '#d8dadc',
          'container-low': '#f2f4f6', 'container-lowest': '#ffffff',
          'container-high': '#e6e8ea', 'container-highest': '#e0e3e5',
        },
        'on-surface': '#191c1e', 'on-surface-variant': '#464555',
        'on-primary': '#ffffff', 'on-secondary': '#ffffff', 'on-error': '#ffffff',
        outline: { variant: '#c7c4d8' }
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: { 'xl': '0.75rem', '2xl': '1.5rem', '3xl': '2.5rem' },
      boxShadow: {
        'ambient': '0 8px 32px 0 rgba(25, 28, 30, 0.06)',
        'elevated': '0 20px 40px -10px rgba(25, 28, 30, 0.08)',
      },
      backdropBlur: { '24': '24px' },
      transitionDuration: { '400': '400ms', '800': '800ms' }
    },
  },
  plugins: [
    plugin(function({ addComponents, addBase, theme }) {
      addBase({
        'h1, h2, h3, h4': { fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.05em' },
        'body': { fontFamily: 'Inter, sans-serif', backgroundColor: theme('colors.background'), color: theme('colors.on-surface') }
      });
      addComponents({
        '.mesh-bg': {
          background: `radial-gradient(at 0% 0%, rgba(53, 37, 205, 0.08) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(78, 222, 163, 0.08) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(53, 37, 205, 0.05) 0, transparent 50%), radial-gradient(at 0% 100%, rgba(78, 222, 163, 0.05) 0, transparent 50%)`
        },
        '.glass-card': {
          backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: theme('boxShadow.ambient')
        },
        '.reveal': { opacity: '0', transform: 'translateY(30px)', transition: 'all 800ms cubic-bezier(0.22, 1, 0.36, 1)' },
        '.reveal.active': { opacity: '1', transform: 'translateY(0)' }
      });
    })
  ],
}