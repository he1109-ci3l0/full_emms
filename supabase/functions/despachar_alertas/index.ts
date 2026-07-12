import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@fullemms.app';

const TZ = 'America/Mexico_City';

function ahoraMX(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}

function horaEnMX(ts: string): Date {
  return new Date(new Date(ts).toLocaleString('en-US', { timeZone: TZ }));
}

function enHorasSilencio(ahora: Date, inicio: string, fin: string): boolean {
  const [hIni, mIni] = inicio.split(':').map(Number);
  const [hFin, mFin] = fin.split(':').map(Number);
  const minActual = ahora.getHours() * 60 + ahora.getMinutes();
  const minIni = hIni * 60 + mIni;
  const minFin = hFin * 60 + mFin;
  if (minIni > minFin) {
    return minActual >= minIni || minActual < minFin;
  }
  return minActual >= minIni && minActual < minFin;
}

async function enviarExpo(tokens: string[], mensaje: string): Promise<void> {
  const body = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title: 'full emms',
    body: mensaje,
    data: {},
  }));
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
}

// Web Push via VAPID (simplified — uses SubtleCrypto available in Deno)
async function enviarWebPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, mensaje: string): Promise<void> {
  if (!VAPID_PRIVATE_KEY) return;

  // Import web-push-lib for Deno
  // We use a minimal VAPID JWT + encrypted payload approach
  const { default: webpush } = await import('https://esm.sh/web-push@3.6.7');
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title: 'full emms', body: mensaje }));
  } catch (_e) {
    // subscription may be stale — ignore
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization' } });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const ahora = new Date();
  const ahoraMXTime = ahoraMX();

  // Leer alertas pendientes
  const { data: alertas, error } = await sb
    .from('alertas')
    .select('*')
    .eq('enviada', false)
    .lte('dispara_en', ahora.toISOString())
    .order('dispara_en');

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!alertas?.length) return new Response(JSON.stringify({ ok: true, enviadas: 0 }), { headers: { 'Content-Type': 'application/json' } });

  // Leer preferencias de silencio por usuario
  const userIds = [...new Set((alertas as { user_id: string }[]).map((a) => a.user_id))];
  const { data: prefs } = await sb.from('preferencias').select('user_id,datos').in('user_id', userIds);
  const silencio: Record<string, { inicio: string; fin: string }> = {};
  for (const p of (prefs ?? []) as { user_id: string; datos: Record<string, unknown> }[]) {
    const s = p.datos?.silencio as { inicio: string; fin: string } | undefined;
    silencio[p.user_id] = s ?? { inicio: '22:00', fin: '07:30' };
  }

  // Leer dispositivos activos
  const { data: dispositivos } = await sb
    .from('dispositivos')
    .select('user_id,plataforma,token')
    .in('user_id', userIds)
    .eq('activo', true);

  const dispByUser: Record<string, { plataforma: string; token: string }[]> = {};
  for (const d of (dispositivos ?? []) as { user_id: string; plataforma: string; token: string }[]) {
    if (!dispByUser[d.user_id]) dispByUser[d.user_id] = [];
    dispByUser[d.user_id].push({ plataforma: d.plataforma, token: d.token });
  }

  const enviadas: string[] = [];
  const pospuestas: string[] = [];

  for (const alerta of alertas as { id: string; user_id: string; mensaje: string; dispara_en: string }[]) {
    const sil = silencio[alerta.user_id] ?? { inicio: '22:00', fin: '07:30' };

    if (enHorasSilencio(ahoraMXTime, sil.inicio, sil.fin)) {
      // Posponer al final del silencio
      const [hFin, mFin] = sil.fin.split(':').map(Number);
      const finSilencio = new Date(ahora);
      finSilencio.setHours(hFin, mFin, 0, 0);
      if (finSilencio <= ahora) finSilencio.setDate(finSilencio.getDate() + 1);
      await sb.from('alertas').update({ dispara_en: finSilencio.toISOString() }).eq('id', alerta.id);
      pospuestas.push(alerta.id);
      continue;
    }

    const devs = dispByUser[alerta.user_id] ?? [];
    const tokensAndroid = devs.filter((d) => d.plataforma === 'android').map((d) => d.token);
    const tokensWeb = devs.filter((d) => d.plataforma !== 'android');

    if (tokensAndroid.length > 0) {
      await enviarExpo(tokensAndroid, alerta.mensaje);
    }

    for (const dev of tokensWeb) {
      try {
        const sub = JSON.parse(dev.token) as { endpoint: string; keys: { p256dh: string; auth: string } };
        await enviarWebPush(sub, alerta.mensaje);
      } catch (_e) {
        // token malformado
      }
    }

    await sb.from('alertas').update({ enviada: true }).eq('id', alerta.id);
    enviadas.push(alerta.id);
  }

  return new Response(
    JSON.stringify({ ok: true, enviadas: enviadas.length, pospuestas: pospuestas.length }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
  );
});
