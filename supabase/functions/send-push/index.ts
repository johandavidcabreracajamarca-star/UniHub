// ============================================================================
// UNIHUB — send-push (Supabase Edge Function)
// ============================================================================
// La llaman dos "Database Webhooks" de Supabase:
//   • INSERT en public.notifications → avisa al comprador/emprendedor del
//     cambio en su pedido.
//   • INSERT en public.messages      → avisa a la otra persona del chat.
// Envía la notificación a todos los celulares/navegadores donde ese usuario
// activó los avisos, y borra las suscripciones que ya no existen.
//
// Secretos necesarios (Edge Functions → Secrets): VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT, WEBHOOK_SECRET. SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY ya vienen incluidos por Supabase.
// ============================================================================

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

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

async function buildMessage(payload: WebhookPayload): Promise<PushMessage | null> {
  const r = payload.record;

  if (payload.table === 'notifications') {
    return {
      userId: String(r.user_id),
      title: 'UniHub · Tu pedido',
      body: String(r.message ?? 'Hay novedades en tu pedido.'),
      url: '/orders',
      tag: `order-${r.order_id}`,
    };
  }

  if (payload.table === 'messages') {
    const { data: conv } = await supabase
      .from('conversations')
      .select('buyer_id, business:businesses(owner_id, name)')
      .eq('id', r.conversation_id)
      .single();
    if (!conv) return null;
    const business = conv.business as unknown as { owner_id: string; name: string } | null;
    const senderIsBuyer = r.sender_id === conv.buyer_id;
    const recipient = senderIsBuyer ? business?.owner_id : conv.buyer_id;
    if (!recipient) return null;

    let senderName = business?.name ?? 'UniHub';
    if (senderIsBuyer) {
      const { data: sender } = await supabase.from('profiles').select('full_name').eq('id', r.sender_id).single();
      senderName = sender?.full_name?.split(' ')[0] ?? 'Un estudiante';
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
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('No autorizado', { status: 401 });
  }

  const payload = (await req.json()) as WebhookPayload;
  if (payload.type !== 'INSERT') return new Response('ignorado');

  const message = await buildMessage(payload);
  if (!message) return new Response('sin destinatario');

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', message.userId);

  const body = JSON.stringify({ title: message.title, body: message.body, url: message.url, tag: message.tag });

  const results = await Promise.allSettled(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // El celular ya no acepta avisos (app desinstalada, permiso quitado…)
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', s.id);
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return Response.json({ sent, total: results.length });
});
