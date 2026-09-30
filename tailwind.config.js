/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6941D9', // Violeta — color principal: botones y elementos de marca
          dark: '#5230B8',
          light: '#EDE6FC', // Lila claro — tarjetas, secciones y fondos secundarios
        },
        secondary: {
          DEFAULT: '#242033', // Tinta — fondos oscuros y botones secundarios
          light: '#E4DDF5',
        },
        accent: {
          DEFAULT: '#FF806C', // Coral — acentos, promociones y detalles del logo (usar texto oscuro encima, no blanco)
          dark: '#C2412D', // Coral oscuro — para TEXTO coral sobre fondos claros (el coral normal no se lee)
          light: '#FFE6E1',
        },
        surface: '#FAF8F5', // Blanco cálido — fondo principal
        ink: '#242033', // Tinta — texto y títulos
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(36, 32, 51, 0.05), 0 1px 3px 0 rgba(36, 32, 51, 0.08)',
        'card-hover': '0 4px 12px 0 rgba(105, 65, 217, 0.14)',
      },
      borderRadius: {
        card: '24px',
        'card-lg': '28px',
        control: '12px',
      },
      maxWidth: {
        app: '480px',
        desktop: '1200px',
      },
    },
  },
  plugins: [],
}
