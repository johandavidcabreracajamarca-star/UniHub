# Avisos al celular — configuración en Supabase

Se hace una sola vez. Toma unos 10 minutos y todo es desde el panel de Supabase.

Los valores secretos están en `supabase/.env.push`, en tu computador. Ese archivo **no** se sube a GitHub.

## 1. Crear la tabla

**SQL Editor → New query**: pega el contenido de `supabase/migrations/20261009_avisos_push.sql` y dale **Run**.

## 2. Crear la función

1. **Edge Functions → Deploy a new function → Via Editor**.
2. Nombre: `send-push`.
3. Borra el código de ejemplo, pega todo `supabase/functions/send-push/index.ts` y dale **Deploy**.
4. Entra a la función → **Details / Settings** y **desactiva "Verify JWT"** (o "Enforce JWT verification"). La función se protege con su propia clave secreta, `WEBHOOK_SECRET`.

## 3. Guardar los secretos

**Edge Functions → Secrets** (o *Project Settings → Edge Functions*). Agrega estos 4, copiando cada valor de `supabase/.env.push`:

| Nombre | Valor |
|---|---|
| `VAPID_PUBLIC_KEY` | el de `.env.push` |
| `VAPID_PRIVATE_KEY` | el de `.env.push` |
| `VAPID_SUBJECT` | el de `.env.push` |
| `WEBHOOK_SECRET` | el de `.env.push` |

## 4. Conectar los disparadores (Database Webhooks)

**Database → Webhooks → Create a new hook**. Crea **dos**, iguales salvo la tabla:

| Campo | Hook 1 | Hook 2 |
|---|---|---|
| Name | `push_pedidos` | `push_mensajes` |
| Table | `notifications` | `messages` |
| Events | ✅ Insert | ✅ Insert |
| Type | Supabase Edge Functions | Supabase Edge Functions |
| Edge Function | `send-push` | `send-push` |
| Method | POST | POST |
| HTTP Headers | `x-webhook-secret` = (tu `WEBHOOK_SECRET`) | igual |

## 5. Probar

1. En el celular, abre UniHub. En iPhone tiene que estar **instalada en la pantalla de inicio**.
2. Ve a **Perfil → Ajustes → Avisos en el celular** y actívalo.
3. Desde otra cuenta, escríbele un mensaje a esa persona o hazle un pedido.
4. Debe llegar el aviso aunque la app esté cerrada.

Si no llega, revisa **Edge Functions → send-push → Logs**.

## Actualizar la función

Cuando cambie `index.ts`, entra a **Edge Functions → send-push → Code**, reemplaza todo el código por el nuevo y dale **Deploy**. Los secretos y los webhooks no se tocan.

## Si los avisos no llegan

Corre en el **SQL Editor** el contenido de `supabase/diagnostico_avisos.sql` (solo lee, no cambia nada). Muestra:

- **llamada a send-push:** lo que respondió la función en cada intento. Si dice `401`, el header `x-webhook-secret` no coincide con el secreto, o "Verify JWT" sigue activado. Si dice `sent: 0` con una nota, ese usuario no tiene avisos activados.
- **celular con avisos:** qué usuarios tienen avisos activados y en qué servicio. `web.push.apple.com` es iPhone y `fcm.googleapis.com` es Android/Chrome.
- **notificación:** a quién iba dirigida cada una.

Si la función responde `{"sent":0,"total":0}` aunque el usuario sí tenga un celular con avisos, corre `supabase/migrations/20261009_avisos_arreglo.sql`: le da a la función permiso para leer la tabla de suscripciones.

> **Al copiar código desde la Terminal de Mac** usa `LANG=en_US.UTF-8 pbcopy < archivo`. Sin eso, las tildes se dañan ("ó" → "√≥").
