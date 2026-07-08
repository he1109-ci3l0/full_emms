# 07_secretaria.md — Fase 7 de full_emms
## La secretaria: chat con el agente, querubín flotante e historial buscable

**Para Claude Code.** Requiere Fases 0–6 cerradas: la secretaria escribe en las tablas de todos los módulos, por eso va al final.

## Paso 0 — Verificación (obligatorio)
Verifica que existan las 20 tablas de las fases 1–6 y sus capas de datos en `src/lib/api/`. Si algo difiere, DETENTE y reporta desviaciones.

## Reglas de esta sesión
Un paso a la vez, `npx tsc --noEmit` tras cada bloque, sin comentarios inline, pasos manuales con confirmación, commit y push a `master`. La API key de Anthropic SOLO vive en secrets de Supabase.

---

## Paso 1 — Migración
CREA `supabase/migrations/0006_secretaria.sql`:

```sql
create table public.preferencias (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  asunto text not null default 'Conversación nueva',
  ultima_actividad timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  conversacion_id uuid not null references public.conversaciones(id) on delete cascade,
  rol text not null check (rol in ('usuaria','agente')),
  texto text not null,
  created_at timestamptz not null default now()
);

create table public.acciones_agente (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  conversacion_id uuid not null references public.conversaciones(id) on delete cascade,
  tipo_accion text not null,
  tabla_destino text not null,
  payload jsonb not null,
  estado text not null default 'propuesta' check (estado in ('propuesta','aplicada','rechazada')),
  registro_id uuid,
  created_at timestamptz not null default now()
);

alter table public.preferencias enable row level security;
alter table public.conversaciones enable row level security;
alter table public.mensajes enable row level security;
alter table public.acciones_agente enable row level security;
create policy "propios" on public.preferencias for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on public.conversaciones for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on public.mensajes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on public.acciones_agente for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index idx_mensajes_fts on public.mensajes using gin (to_tsvector('spanish', texto));
create index idx_conversaciones_fts on public.conversaciones using gin (to_tsvector('spanish', asunto));
create index idx_mensajes_conv on public.mensajes (conversacion_id, created_at);
```

**Paso manual para la usuaria:** correr en el SQL Editor y confirmar las 4 tablas.

## Paso 2 — Edge Function `secretaria`
CREA `supabase/functions/secretaria/index.ts` (Deno):
- Recibe `{ conversacion_id, mensaje }` con el JWT de la usuaria; crea cliente Supabase con ese JWT para que TODA operación pase por RLS.
- Guarda el mensaje de la usuaria, carga los últimos 30 mensajes de la conversación y llama a la API de Anthropic (`claude-sonnet-4-6`, `ANTHROPIC_API_KEY` desde secrets).
- System prompt: es la secretaria personal de la usuaria; fecha actual y zona America/Mexico_City; hoy en contexto (pendientes activos con fecha, eventos de la semana) inyectado como resumen; responde breve y directo en español; toda escritura la propone mediante tools, nunca afirma haber hecho algo que no pasó por confirmación.
- **Tools (una por escritura, con JSON schema espejo de las tablas):** `crear_pendiente`, `completar_pendiente`, `crear_evento`, `crear_nota`, `registrar_movimiento`, `crear_cobranza`, `registrar_pago_cobranza`, `crear_pago_programado`, `registrar_entrenamiento`, `registrar_sueno`, `registrar_animo`, `crear_procedimiento`, `agendar_consulta`, `crear_entrevista`, y `consultar` (lectura con parámetros: tabla permitida + filtros simples; ejecuta select vía RLS y devuelve máximo 20 filas).
- Cuando el modelo usa una tool de escritura: NO ejecutar el insert; guardar en `acciones_agente` como `propuesta` y responder a la app el texto del agente + la(s) propuesta(s). `consultar` sí se ejecuta directo (solo lectura) y su resultado se devuelve al modelo para que responda con datos.
- Endpoint adicional en la misma función: `{ accion: 'confirmar'|'rechazar', accion_id }` — confirmar ejecuta el insert en `tabla_destino` con el payload (validado contra una lista blanca de tablas y columnas), guarda `registro_id`, marca `aplicada`; rechazar solo marca `rechazada`.
- Al cerrar (o cada 10 mensajes), si el asunto sigue siendo el default, pedir al modelo un asunto de máximo 6 palabras y actualizarlo.

**Pasos manuales para la usuaria:**
1. Obtener API key en console.anthropic.com → API Keys (requiere cuenta con créditos; el uso personal del chat cuesta centavos por conversación).
2. Dashboard de Supabase → Edge Functions → Secrets → agregar `ANTHROPIC_API_KEY`.
3. Deploy: la función se sube desde el dashboard (Edge Functions → Deploy new function → pegar el código) si no se quiere instalar el CLI; Claude Code deja el archivo listo y da la instrucción exacta.

## Paso 3 — Querubín flotante (el botón del chat)
CREA `src/components/Querubin.tsx`:
- Burbuja circular con `querubin_chat.jpg`, borde 4px granate, sombra, 76px (60px en pantallas chicas), montada sobre TODA la app autenticada (en el layout de tabs, encima del contenido).
- **Arrastrable a cualquier punto de la pantalla** con react-native-gesture-handler + Reanimated (funciona con dedo en nativo y cursor en web); al soltar, imán suave al borde lateral más cercano con animación de resorte; nunca queda sobre la barra de tabs ni fuera de pantalla (clamp + safe areas).
- La posición se persiste en `preferencias.datos.querubin` y se restaura al abrir la app.
- Badge granate con número de propuestas pendientes de confirmar.
- Tocar (sin arrastrar) abre la ventana de chat; el querubín se oculta mientras la ventana está abierta y reaparece donde estaba al cerrarla.

## Paso 4 — Ventana de chat
CREA `src/components/VentanaChat.tsx` estilo messenger sobre el lenguaje visual del prototipo:
- Panel anclado a la esquina inferior (ancho completo en móvil, 380px en web/tablet), encabezado con tapiz Morris en franja delgada, "Secretaria" en Philosopher granate y botones minimizar (vuelve al querubín) e historial.
- Burbujas: usuaria en hueso alineadas a la derecha, agente en rosa pálido a la izquierda; hora en etiqueta Nobile.
- **Tarjetas de confirmación:** cada propuesta del agente se muestra como tarjeta con resumen legible ("Evento: Podólogo · jue 9 jul · 17:00 · contexto Personal") y botones Confirmar (granate) / Rechazar; al confirmar se ejecuta y la tarjeta cambia a "aplicado ✓" en salvia con acceso al registro creado.
- Input con envío por Enter; indicador "escribiendo…" en Zeyada mientras responde la función.
- La conversación en turno persiste entre aperturas hasta que la usuaria toque "nueva conversación".

## Paso 5 — Historial de chats
CREA `app/chats.tsx` (ruta stack, accesible desde el botón historial de la ventana):
- Lista de conversaciones (asunto en Philosopher, último mensaje truncado, fecha) ordenada por actividad.
- Buscador que combina: texto libre (full-text en español sobre asuntos y mensajes vía los índices GIN, con una función RPC `buscar_chats(q)`) + filtro por rango de fechas.
- Tocar una conversación la abre en modo lectura con opción "continuar aquí" (la vuelve la conversación en turno).

## Cierre de fase (checklist)
- [ ] `npx tsc --noEmit` sin errores y la Edge Function desplegada responde.
- [ ] "Agéndame dentista el viernes a las 10" → propuesta con tarjeta → Confirmar → el evento existe y se ve en el Calendario.
- [ ] "¿Qué pendientes tengo de Antioquia?" → `consultar` responde con los datos reales.
- [ ] Rechazar una propuesta no escribe nada en la tabla destino.
- [ ] El querubín se arrastra, imanta al borde, y su posición sobrevive a cerrar y abrir la app.
- [ ] Búsqueda en historial encuentra una conversación por palabra del asunto y por palabra de un mensaje.
- [ ] La API key no aparece en ningún archivo del repo (`git grep -i anthropic` limpio de claves).
- [ ] Verificado en web y Android.
- [ ] Commit y push a `master`.
