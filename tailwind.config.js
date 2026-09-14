/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3F5A3A', // Verde musgo — identidad "Tinto y Papel" (remix con verde de primario)
          dark: '#2A3E27',
          light: '#DEE6D8',
        },
        secondary: {
          DEFAULT: '#4A2E22', // Café tostado — distingue elementos como "verificado" sin competir con el primario
          light: '#E8DFD3',
        },
        accent: {
          DEFAULT: '#B1502B', // Ladrillo/cobre — resalta datos clave (precios, calificaciones, CTAs secundarios)
          light: '#F0D2C0',
        },
        surface: '#EDEAE3', // Papel/piedra clara — fondos neutros
        ink: '#2A2320', // Texto — café oscuro, cálido y con buena legibilidad
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(63, 90, 58, 0.05), 0 1px 3px 0 rgba(63, 90, 58, 0.08)',
        'card-hover': '0 4px 12px 0 rgba(63, 90, 58, 0.10)',
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
