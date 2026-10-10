import { loadFont } from '@remotion/google-fonts/Inter';
import { loadFont as loadSerif } from '@remotion/google-fonts/Fraunces';

// Paleta oficial de UniHub — idéntica a tailwind.config.js de la app
export const C = {
  primary: '#6941D9', // Violeta — marca y botones
  primaryDark: '#5230B8',
  primaryLight: '#EDE6FC',
  secondary: '#242033', // Tinta — fondos oscuros
  secondaryLight: '#E4DDF5',
  accent: '#FF806C', // Coral — acentos (texto oscuro encima)
  accentDark: '#C2412D', // Coral oscuro — texto coral sobre fondos claros
  accentLight: '#FFE6E1',
  surface: '#FAF8F5',
  ink: '#242033',
  white: '#FFFFFF',
};

export const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
});

export const FPS = 30;

// Duración de cada escena (en frames)
// Todas son múltiplos de 15 frames (medio beat a 120 BPM) para que los
// cortes caigan en el ritmo de la música.
export const SCENES = {
  hook: 105,
  question: 90,
  logo: 120,
  explore: 165,
  categories: 105,
  chat: 150,
  notifications: 165,
  trust: 135,
  share: 135,
  seller: 165,
  cta: 180,
};

export const TOTAL = Object.values(SCENES).reduce((a, b) => a + b, 0);

export const formatCOP = (n: number) => '$' + Math.round(n).toLocaleString('es-CO').replace(/,/g, '.');

export const { fontFamily: serif } = loadSerif('normal', { weights: ['500', '600', '700'], subsets: ['latin'] });
