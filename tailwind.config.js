/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B2A4A', // Azul marino — Profesionalismo, confianza
          dark: '#12203A',
          light: '#E3E7EE',
        },
        secondary: {
          DEFAULT: '#4A6FA5', // Azul medio — distingue elementos como "verificado" sin competir con el primario
          light: '#E3E9F2',
        },
        accent: {
          DEFAULT: '#C99A3A', // Dorado/mostaza — resalta datos clave (precios, calificaciones, CTAs secundarios)
          light: '#F5E9D0',
        },
        surface: '#E8E9EB', // Gris claro — fondos neutros
        ink: '#1F2937', // Texto — se mantiene oscuro y neutro para buena legibilidad
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(27, 42, 74, 0.05), 0 1px 3px 0 rgba(27, 42, 74, 0.08)',
        'card-hover': '0 4px 12px 0 rgba(27, 42, 74, 0.10)',
      },
      borderRadius: {
        card: '16px',
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
