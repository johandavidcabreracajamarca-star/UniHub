// ============================================================================
// VISTA PREVIA AL COMPARTIR (Vercel Function)
// ============================================================================
// WhatsApp, Instagram, Telegram, iMessage… no ejecutan JavaScript: arman la
// tarjeta del link con las etiquetas <meta property="og:..."> del HTML. Como
// UniHub es una SPA, todas las páginas traen las mismas etiquetas genéricas.
//
// vercel.json manda aquí SOLO a esos robots cuando piden /product/:id o
// /business/:id. Esta función devuelve el mismo index.html de la app, pero con
// el nombre, el precio y la foto reales. Si algo falla, devuelve el index.html
// normal: el link sigue funcionando, solo con la tarjeta genérica.
//
// Lee de Supabase con la llave pública (anon), igual que la app sin sesión:
// solo ve lo que las reglas de seguridad permiten ver a cualquiera.
// ============================================================================

interface PreviewRequest {
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

interface PreviewResponse {
  status(code: number): PreviewResponse;
  setHeader(name: string, value: string): void;
  send(body: string): void;
}

interface Preview {
  kind: 'product' | 'business';
  title: string;
  description: string;
  image: string | null;
  path: string;
}

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function formatCOP(value: number): string {
  return '$' + String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function absoluteImage(url: unknown): string | null {
  return typeof url === 'string' && /^https:\/\//.test(url.trim()) ? url.trim() : null;
}

async function supabaseFirst(path: string): Promise<Record<string, unknown> | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const headers: Record<string, string> = { apikey: SUPABASE_KEY };
  // Las llaves clásicas son JWT y también van como Bearer; las nuevas (sb_publishable_…) no.
  if (SUPABASE_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SUPABASE_KEY}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers, signal: AbortSignal.timeout(4000) });
  if (!res.ok) return null;
  const rows: unknown = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? (rows[0] as Record<string, unknown>) : null;
}

// Mismo cálculo que src/utils/discount.ts
function currentPrice(p: Record<string, unknown>): string {
  const variants = Array.isArray(p.variants) ? (p.variants as { price: number }[]).map((v) => Number(v.price)).filter((n) => n > 0) : [];
  if (variants.length > 0) {
    const min = Math.min(...variants);
    return variants.every((n) => n === min) ? formatCOP(min) : `Desde ${formatCOP(min)}`;
  }
  const price = Number(p.price) || 0;
  const pct = Number(p.discount_percent) || 0;
  const starts = Date.parse(String(p.discount_starts_at ?? ''));
  const ends = Date.parse(String(p.discount_ends_at ?? ''));
  const now = Date.now();
  if (pct > 0 && !Number.isNaN(starts) && !Number.isNaN(ends) && now >= starts && now <= ends) {
    return `${formatCOP(price * (1 - pct / 100))} (-${pct}%)`;
  }
  return formatCOP(price);
}

async function loadPreview(type: string, id: string): Promise<Preview | null> {
  if (!UUID.test(id)) return null;

  if (type === 'product') {
    const p = await supabaseFirst(
      `products?id=eq.${id}&select=name,description,price,image,discount_percent,discount_starts_at,discount_ends_at,` +
        'business:businesses(name),variants:product_variants(price)'
    );
    if (!p) return null;
    const business = (p.business as { name?: string } | null)?.name;
    const intro = `${currentPrice(p)} · ${business ? `de ${business} ` : ''}en UniHub`;
    return {
      kind: 'product',
      title: String(p.name ?? 'Producto en UniHub'),
      description: truncate(`${intro}. ${String(p.description ?? '')}`, 180),
      image: absoluteImage(p.image),
      path: `/product/${id}`,
    };
  }

  if (type === 'business') {
    const b = await supabaseFirst(`businesses?id=eq.${id}&select=name,description,logo,cover_image,rating`);
    if (!b) return null;
    const rating = Number(b.rating) > 0 ? `★ ${Number(b.rating).toFixed(1)} · ` : '';
    return {
      kind: 'business',
      title: `${String(b.name ?? 'Emprendimiento')} en UniHub`,
      description: truncate(`${rating}Emprendimiento de la comunidad universitaria. ${String(b.description ?? '')}`, 180),
      image: absoluteImage(b.cover_image) ?? absoluteImage(b.logo),
      path: `/business/${id}`,
    };
  }

  return null;
}

function setMeta(html: string, attr: 'property' | 'name', key: string, value: string | null): string {
  const pattern = new RegExp(`\\s*<meta\\s+${attr}="${key.replace(/[.:]/g, '\\$&')}"\\s+content="[^"]*"\\s*/?>`, 'i');
  const tag = value === null ? '' : `\n    <meta ${attr}="${key}" content="${escapeHtml(value)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return value === null ? html : html.replace('</head>', `${tag}\n  </head>`);
}

function applyPreview(html: string, preview: Preview, origin: string): string {
  const url = `${origin}${preview.path}`;
  const image = preview.image ?? `${origin}/og-image.png`;
  const pageTitle = preview.kind === 'product' ? `${preview.title} · UniHub` : preview.title;
  let out = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);
  out = setMeta(out, 'name', 'description', preview.description);
  out = setMeta(out, 'property', 'og:type', preview.kind === 'product' ? 'product' : 'website');
  out = setMeta(out, 'property', 'og:url', url);
  out = setMeta(out, 'property', 'og:title', preview.title);
  out = setMeta(out, 'property', 'og:description', preview.description);
  out = setMeta(out, 'property', 'og:image', image);
  // El tamaño 1200×630 es el de la imagen genérica; las fotos de productos varían
  out = setMeta(out, 'property', 'og:image:width', preview.image ? null : '1200');
  out = setMeta(out, 'property', 'og:image:height', preview.image ? null : '630');
  out = setMeta(out, 'property', 'og:site_name', 'UniHub');
  out = setMeta(out, 'property', 'og:locale', 'es_CO');
  out = setMeta(out, 'name', 'twitter:title', preview.title);
  out = setMeta(out, 'name', 'twitter:description', preview.description);
  out = setMeta(out, 'name', 'twitter:image', image);
  out = setMeta(out, 'name', 'x-unihub-preview', preview.kind);
  return out;
}

const FALLBACK_HTML = `<!doctype html><html lang="es"><head><meta charset="UTF-8" /><title>UniHub</title></head><body><a href="/">UniHub</a></body></html>`;

export default async function handler(req: PreviewRequest, res: PreviewResponse) {
  const host = first(req.headers['x-forwarded-host']) || first(req.headers.host);
  const origin = `https://${host}`;
  const type = first(req.query.type);
  const id = first(req.query.id);

  let html = FALLBACK_HTML;
  try {
    const page = await fetch(`${origin}/index.html`, { signal: AbortSignal.timeout(4000) });
    if (page.ok) html = await page.text();
  } catch {
    // seguimos con el HTML mínimo
  }

  try {
    const preview = await loadPreview(type, id);
    if (preview) html = applyPreview(html, preview, origin);
    else html = setMeta(html, 'name', 'x-unihub-preview', 'none');
  } catch {
    html = setMeta(html, 'name', 'x-unihub-preview', 'error');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // 10 min en la CDN de Vercel: si cambia el precio o la foto, se actualiza pronto
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(html);
}
