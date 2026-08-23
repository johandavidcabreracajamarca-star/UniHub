/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16A34A', // Verde primario — Confianza
          dark: '#128A3E',
          light: '#DCFCE7',
        },
        secondary: {
          DEFAULT: '#2563EB', // Azul secundario — Comunidad
          light: '#DBEAFE',
        },
        accent: {
          DEFAULT: '#F59E0B', // Naranja — Emprendimiento
          light: '#FEF3C7',
        },
        surface: '#F8FAFC', // Fondo
        ink: '#1F2937', // Texto
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(31, 41, 55, 0.04), 0 1px 3px 0 rgba(31, 41, 55, 0.06)',
        'card-hover': '0 4px 12px 0 rgba(31, 41, 55, 0.08)',
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
