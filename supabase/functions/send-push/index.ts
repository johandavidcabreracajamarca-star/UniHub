// ============================================================================
// UNIHUB — send-push (Supabase Edge Function) · v2
// ============================================================================
// La llaman dos "Database Webhooks" de Supabase:
//   • INSERT en public.notifications → avisa al comprador del cambio en su
//     pedido, o al emprendedor de una venta nueva.
//   • INSERT en public.messages      → avisa a la otra persona del chat.
// Envía la notificación a todos los celulares/navegadores donde ese usuario
// activó los avisos, y borra las suscripciones que ya no existen.
//
// Secretos necesarios (Edge Functions → Secrets): VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT, WEBHOOK_SECRET. La URL del proyecto y la
// llave de servicio ya vienen incluidas por Supabase.
//
// Cada respuesta explica qué pasó (enviados, fallos y por qué). Se puede ver
// en Edge Functions → send-push → Logs, o con el diagnóstico de
// supabase/migrations/20261009_avisos_ventas.sql.
// ============================================================================

import webpush from 'npm:web-push@3.6.7';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
}

interface PushMessage {
  userId: string;
  title: string;
  body: string;
  url: string;
  tag: string;
}

function env(name: string): string {
  return (Deno.env.get(name) ?? '').trim();
}

// Llave de servicio: la clásica; si el proyecto ya no la tiene, la nueva (sb_secret_…).
function serviceKey(): string {
  const legacy = env('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(env('SUPABASE_SECRET_KEYS') || '{}') as Record<string, unknown>;
    const first = Object.values(keys).find((k): k is string => typeof k === 'string' && k.length > 0);
    if (first) return first;
  } catch {
    // formato desconocido
  }
  throw new Error('Supabase no entregó la llave de servicio a la función');
}

async function buildMessage(supabase: SupabaseClient, payload: WebhookPayload): Promise<PushMessage | null> {
  const r = payload.record;

  if (payload.table === 'notifications') {
    const link = typeof r.link === 'string' && r.link.startsWith('/') ? r.link : '/orders';
    const isSale = link.startsWith('/dashboard');
    return {
      userId: String(r.user_id),
      title: isSale ? '¡Nueva venta! 🎉' : 'UniHub · Tu pedido',
      body: String(r.message ?? 'Hay novedades en tu pedido.'),
      url: link,
      tag: `${isSale ? 'sale' : 'order'}-${r.order_id}`,
    };
  }

  if (payload.table === 'messages') {
    const { data: conv, error } = await supabase
      .from('conversations')
      .select('buyer_id, business:businesses(owner_id, name)')
      .eq('id', r.conversation_id)
      .single();
    if (error || !conv) throw new Error(`No se encontró la conversación: ${error?.message ?? 'vacía'}`);

    const business = conv.business as unknown as { owner_id: string; name: string } | null;
    const senderIsBuyer = r.sender_id === conv.buyer_id;
    const recipient = senderIsBuyer ? business?.owner_id : (conv.buyer_id as string);
    if (!recipient) return null;

    let senderName = business?.name ?? 'UniHub';
    if (senderIsBuyer) {
      const { data: sender } = await supabase.from('profiles').select('full_name').eq('id', r.sender_id).single();
      senderName = (sender?.full_name as string | undefined)?.split(' ')[0] ?? 'Un estudiante';
    }
    const text = String(r.content ?? '');
    return {
      userId: recipient,
      title: `Mensaje de ${senderName}`,
      body: text.length > 120 ? `${text.slice(0, 117)}…` : text,
      url: `/messages/${r.conversation_id}`,
      tag: `chat-${r.conversation_id}`,
    };
  }

  return null;
}

Deno.serve(async (req) => {
  const expected = env('WEBHOOK_SECRET');
  const received = (req.headers.get('x-webhook-secret') ?? '').trim();
  if (!expected || received !== expected) {
    const reason = !expected
      ? 'falta el secreto WEBHOOK_SECRET en Edge Functions → Secrets'
      : 'el header x-webhook-secret del webhook no coincide con WEBHOOK_SECRET';
    console.error(`[send-push] No autorizado: ${reason}`);
    return Response.json({ error: `No autorizado: ${reason}` }, { status: 401 });
  }

  try {
    const missing = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'].filter((name) => !env(name));
    if (missing.length > 0) throw new Error(`Faltan secretos: ${missing.join(', ')}`);
    webpush.setVapidDetails(env('VAPID_SUBJECT'), env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));

    const supabase = createClient(env('SUPABASE_URL'), serviceKey(), { auth: { persistSession: false } });

    const payload = (await req.json()) as WebhookPayload;
    if (payload.type !== 'INSERT') return Response.json({ skipped: 'no es un INSERT' });

    const message = await buildMessage(supabase, payload);
    if (!message) return Response.json({ skipped: 'sin destinatario' });

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', message.userId);
    if (error) throw new Error(`No se pudo leer push_subscriptions: ${error.message}`);
    if (!subs || subs.length === 0) {
      const note = `El usuario ${message.userId.slice(0, 8)} no tiene avisos activados en ningún celular`;
      console.log(`[send-push] ${note}`);
      return Response.json({ sent: 0, total: 0, note });
    }

    const body = JSON.stringify({ title: message.title, body: message.body, url: message.url, tag: message.tag });
    const failures: string[] = [];
    let sent = 0;

    await Promise.all(
      subs.map(async (s) => {
        const host = new URL(s.endpoint as string).host;
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint as string, keys: { p256dh: s.p256dh as string, auth: s.auth as string } },
            body,
            { TTL: 60 * 60 * 24, urgency: 'high' }
          );
          sent += 1;
        } catch (err) {
          const e = err as { statusCode?: number; body?: string; message?: string };
          failures.push(`${host}: ${e.statusCode ?? 'sin código'} ${e.body || e.message || String(err)}`.slice(0, 200));
          // El celular ya no acepta avisos (app desinstalada, permiso quitado…)
          if (e.statusCode === 404 || e.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', s.id);
          }
        }
      })
    );

    console.log(`[send-push] ${payload.table}: ${sent}/${subs.length} enviados`, failures);
    return Response.json({ sent, total: subs.length, failures });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[send-push] Error: ${msg}`);
    return Response.json({ error: msg }, { status: 500 });
  }
});
