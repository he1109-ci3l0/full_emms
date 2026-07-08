# 08_alertas.md — Fase 8 de full_emms
## Alertas y notificaciones: la secretaria proactiva

**Para Claude Code.** Requiere Fases 0–7 cerradas.

## Paso 0 — Verificación (obligatorio)
Verifica las tablas de todas las fases anteriores, la Edge Function `secretaria` desplegada y la tabla `preferencias`. Si algo difiere, DETENTE y reporta desviaciones.

## Reglas de esta sesión
Un paso a la vez, `npx tsc --noEmit` tras cada bloque, sin comentarios inline, pasos manuales con confirmación, commit y push a `master`.

---

## Paso 1 — Migración
CREA `supabase/migrations/0007_alertas.sql`:

```sql
create table public.dispositivos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plataforma text not null check (plataforma in ('android','ios_pwa','web')),
  token text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origen_tabla text not null,
  origen_id uuid,
  mensaje text not null,
  dispara_en timestamptz not null,
  enviada boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.dispositivos enable row level security;
alter table public.alertas enable row level security;
create policy "propios" on public.dispositivos for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on public.alertas for select using (user_id = auth.uid());

create index idx_alertas_pendientes on public.alertas (enviada, dispara_en);
```

## Paso 2 — Generación de alertas (SQL)
En el mismo archivo de migración, CREA la función `generar_alertas()` (security definer, schema private si existe el patrón, si no en public con revoke a anon/authenticated) que inserta en `alertas` evitando duplicados (no insertar si ya existe alerta no enviada del mismo origen):
1. Pendientes con `fecha_limite` = mañana y no hechos → "Vence mañana: {titulo}".
2. Cobranzas pendientes/parciales vencidas hoy → "Cobranza vencida: {deudor} — {concepto}".
3. Pagos programados a 2 días → "Pago próximo: {acreedor} {monto}".
4. Eventos de mañana → "Mañana: {titulo} {hora}" (las entrevistas además con alerta 2 horas antes el mismo día).
5. Medicamentos activos → una alerta por horario del día (dispara_en = fecha+horario).
6. Predicción de ciclo a 2 días (usando la misma lógica de promedio de intervalos) → mensaje discreto "Recordatorio de calendario personal" sin detalle en la notificación.
7. Suplementos con `recompra_fecha` <= hoy → "Recomprar: {nombre}".
8. Sin registro de sueño/ánimo por 3+ días → "¿Hacemos tu check-in? Llevas unos días sin registrar" (máximo una vez cada 3 días).
Las sustancias NUNCA generan notificaciones.

## Paso 3 — pg_cron
**Paso manual para la usuaria:** Dashboard → Database → Extensions → habilitar `pg_cron`. Después Claude Code agrega al final de la migración (y la usuaria corre en el SQL Editor):

```sql
select cron.schedule('generar-alertas', '*/15 * * * *', $$ select public.generar_alertas(); $$);
```

## Paso 4 — Despacho: Edge Function `despachar_alertas`
CREA `supabase/functions/despachar_alertas/index.ts`:
- Corre con service role (es un job de sistema, no lleva JWT de usuaria): lee alertas con `enviada = false` y `dispara_en <= now()`, agrupa por usuaria, envía a cada dispositivo activo y marca `enviada = true`.
- **Android:** Expo Push API (`https://exp.host/--/api/v2/push/send`) con los tokens Expo guardados en `dispositivos`.
- **iOS PWA / web:** Web Push con VAPID (librería web-push para Deno); las claves VAPID en secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).
- Programarla: `select cron.schedule('despachar-alertas', '*/15 * * * *', ...)` invocándola vía `pg_net` al endpoint de la función con el header de service role guardado en Vault — Claude Code deja las instrucciones exactas del dashboard para este paso manual.

## Paso 5 — Cliente
- **Android:** `expo-notifications`: pedir permiso en el primer login, obtener Expo push token y registrarlo en `dispositivos` (plataforma android). Manejar tap en notificación → abrir la pestaña correspondiente según `origen_tabla`.
- **iOS PWA / web:** service worker `public/sw.js` con handler de push + `Notification.requestPermission()` desde un botón "Activar notificaciones" en `app/respaldo.tsx` (renombrar esa pantalla a "Ajustes" con secciones Respaldo y Notificaciones); suscripción `pushManager.subscribe` con la VAPID pública y registro en `dispositivos` (plataforma ios_pwa o web).
- **Dentro de la app:** campana en `BarraMorris` con las alertas de los últimos 7 días (leídas de la tabla) y badge de no vistas (marca de vistas en `preferencias.datos.alertas_vistas_hasta`).
- **Horas de silencio:** en Ajustes, rango configurable (default 22:00–07:30) guardado en `preferencias`; `despachar_alertas` pospone lo no urgente que caiga en ese rango al final del silencio.

## Cierre de fase (checklist)
- [ ] `npx tsc --noEmit` sin errores; ambas funciones desplegadas; ambos cron jobs listados en `select * from cron.job;`.
- [ ] Pendiente con fecha límite mañana genera alerta al correr `select generar_alertas();` manualmente, y no la duplica al correrla dos veces.
- [ ] Notificación push recibida en el Android real.
- [ ] Notificación push recibida en el iPhone con la PWA instalada (requiere Fase 9 para la instalación; si aún no, dejar este punto pendiente y retomarlo en el cierre de la Fase 9).
- [ ] La campana muestra el historial y el badge se limpia al abrirla.
- [ ] Commit y push a `master`.
