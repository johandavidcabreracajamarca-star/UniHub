import type { ProductCategory } from '../types';

// LoremFlickr funciona mejor con términos concretos en inglés. Antes se enviaba
// solo la primera palabra del nombre (por ejemplo "caja" o "tutoría"), lo cual
// producía fotografías genéricas o sin relación con el producto.
const CATEGORY_KEYWORDS: Record<ProductCategory, string[]> = {
  comida: ['food'], ropa: ['clothing'], tecnologia: ['technology'],
  accesorios: ['accessory'], servicios: ['professional'], otros: ['product'],
};

const STOP_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'para', 'por', 'con', 'sin', 'una',
  'uno', 'unos', 'unas', 'y', 'en', 'al', 'caja', 'combo', 'unidad', 'nuevo',
]);

const TRANSLATIONS: Record<string, string> = {
  torta: 'cake', chocolate: 'chocolate', brownie: 'brownie', cupcakes: 'cupcakes',
  cupcake: 'cupcake', comida: 'food', jugo: 'juice', natural: 'fresh', frutos: 'nuts',
  secos: 'nuts', cable: 'usb cable', funda: 'laptop sleeve', portatil: 'laptop',
  mantenimiento: 'laptop repair', buzo: 'hoodie', camiseta: 'tshirt', gorra: 'cap',
  ropa: 'clothing', accesorio: 'accessory', accesorios: 'accessories',
  tutoria: 'tutoring', calculo: 'calculus', programacion: 'programming',
  microeconomia: 'economics', servicio: 'service', servicios: 'service',
};

function stableSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return (hash % 9999) + 1;
}

function searchKeywords(name: string, category: ProductCategory): string[] {
  const words = name.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .flatMap((word) => (TRANSLATIONS[word] ?? word).split(' '))
    .slice(0, 3);
  return [...new Set([...words, ...CATEGORY_KEYWORDS[category]])];
}

export function getAutoProductImage(name: string, category: ProductCategory, seedKey: string): string {
  const keywords = searchKeywords(name, category).map(encodeURIComponent).join(',');
  return `https://loremflickr.com/480/480/${keywords}?lock=${stableSeed(seedKey)}`;
}
