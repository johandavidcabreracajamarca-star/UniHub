// Búsquedas recientes del usuario, guardadas solo en su dispositivo.

const KEY = 'unihub:recent-searches';
const MAX = 6;

export function getRecentSearches(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): string[] {
  const clean = query.trim();
  if (clean.length < 2) return getRecentSearches();
  const next = [clean, ...getRecentSearches().filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignorar
  }
  return next;
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignorar
  }
}
