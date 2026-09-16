// ============================================================================
// FILTRO DE CONTACTO — detecta si un texto libre (descripción de producto o
// de emprendimiento) incluye un número de teléfono, mención a WhatsApp u
// otra forma de contacto directo, para evitar que compradores y vendedores
// se salgan de la app a coordinar (y UniHub pierda el registro del trato).
//
// No es perfecto (alguien podría escribir el número con palabras, por
// ejemplo), pero bloquea el caso obvio y más común.
// ============================================================================

const KEYWORD_PATTERNS: RegExp[] = [
  /whats\s*app/i,
  /wasap/i,
  /watsap/i,
  /\bwsp\b/i,
  /wa\.me/i,
  /api\.whatsapp/i,
  /\bcel(ular)?\b[:\s]*\d/i,
  /\bnumero\b[:\s]*\d/i,
  /\bmi\s+numero\b/i,
  /\bcontactame\b/i,
  /\bllamame\b/i,
  /instagram\.com/i,
  /\b@[a-z0-9_.]{3,}/i, // menciones tipo @usuario (Instagram/Telegram)
];

export function containsContactInfo(text: string): string | null {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes para que "número" también matchee
    .toLowerCase();

  for (const pattern of KEYWORD_PATTERNS) {
    if (pattern.test(normalized)) {
      return 'No está permitido incluir WhatsApp, redes sociales u otras formas de contacto en la descripción. Usa el chat de UniHub para coordinar con los compradores.';
    }
  }

  // Secuencia de 7+ dígitos (permitiendo espacios, guiones o puntos entre
  // ellos) — patrón típico de un número de teléfono escrito a mano.
  const phoneLikeMatch = normalized.match(/(?:\d[\s.\-]?){7,}/);
  if (phoneLikeMatch) {
    const digitsOnly = phoneLikeMatch[0].replace(/\D/g, '');
    if (digitsOnly.length >= 7) {
      return 'Parece que incluiste un número de teléfono en la descripción. Por seguridad, no está permitido — usa el chat de UniHub para coordinar con los compradores.';
    }
  }

  return null;
}
