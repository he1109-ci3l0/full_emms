# 05_bienestar.md — Fase 5 de full_emms
## Bienestar: entrenos, nutrición, suplementos, ánimo, sueño, sustancias

**Para Claude Code.** Requiere Fases 0–4 cerradas.

## Paso 0 — Verificación (obligatorio)
Verifica tablas y tipos de fases anteriores y el patrón de pills por sección. Si algo difiere, DETENTE y reporta desviaciones.

## Reglas de esta sesión
Un paso a la vez, `npx tsc --noEmit` tras cada bloque, sin comentarios inline, pasos manuales con confirmación, commit y push a `master`.

## Nota de privacidad (decisión de arquitectura, informar a la usuaria)
El plan original consideraba cifrado por columna con pgsodium; Supabase deprecó ese mecanismo. La protección de estos datos queda en: RLS estricta por usuaria, cifrado en reposo de Supabase, y ninguna aparición de datos sensibles (sustancias, síntomas de ciclo) en el Panel ni en notificaciones. Si más adelante se quiere cifrado adicional a nivel app, se planifica como fase propia.

---

## Paso 1 — Migración
CREA `supabase/migrations/0004_bienestar.sql`:

```sql
create table public.entrenamientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  actividad text not null,
  duracion_min integer not null check (duracion_min > 0),
  lugar text,
  intensidad smallint not null check (intensidad between 1 and 5),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutricion (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  registro text not null,
  etiquetas jsonb not null default '[]'::jsonb,
  suplementos_tomados jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suplementos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  dosis text,
  existencias integer,
  recompra_fecha date,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.animo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  nivel smallint not null check (nivel between 1 and 5),
  texto text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sueno (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  hora_dormir time,
  hora_despertar time,
  calidad smallint check (calidad between 1 and 5),
  higiene jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sustancias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  sustancia text not null,
  cantidad text,
  contexto_consumo text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['entrenamientos','nutricion','suplementos','animo','sueno','sustancias'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "propios" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create trigger t_%I before update on public.%I for each row execute function public.tocar_updated_at()', t, t);
  end loop;
end $$;

create index idx_entrenamientos_user_fecha on public.entrenamientos (user_id, fecha desc);
create index idx_sueno_user_fecha on public.sueno (user_id, fecha desc);
```

**Paso manual para la usuaria:** correr en el SQL Editor y confirmar las 6 tablas.

## Paso 2 — Catálogos y capa de datos
CREA `src/lib/actividades.ts`: catálogo base — pesas, natación, pilates, barre, estiramientos, yoga, sprints, acondicionamiento, baile — más las actividades personalizadas que la usuaria agregue (guardadas en `preferencias` cuando exista esa tabla en Fase 7; mientras, en el catálogo local + campo libre). Cada actividad con un color asignado rotando las paletas.
CREA `src/lib/higiene_sueno.ts`: checklist base — sin pantallas 1h antes, sin cafeína después de las 16h, horario regular, cuarto oscuro, cuarto fresco, sin alcohol, cena ligera.
CREA `src/types/bienestar.ts` y `src/lib/api/bienestar.ts` con hooks y mutaciones por tabla, más `useSemanaBienestar(lunes)`: agregado semanal (minutos totales, minutos por actividad, intensidad media, lugares usados, días con registro de sueño/ánimo/nutrición).

## Paso 3 — Pestaña Bienestar
EDITA `app/(tabs)/bienestar.tsx`: pills — **Hoy | Semana | Entrenos | Nutrición | Sueño | Sustancias** — acento `HOJAS.salvia`.

- **Hoy (check-in diario compuesto, la pantalla central del módulo):** ¿cómo me siento? (5 niveles como puntos de color de vino→salvia + texto opcional), ¿cómo dormí? (horas dormir/despertar, calidad 1–5, checklist de higiene como chips), ¿cómo comí? (texto libre + etiquetas: casa/fuera/orden, con hambre real/por ansiedad, hidratación + suplementos tomados como chips desde el catálogo), ¿entrené? (acceso directo al formulario de entreno). Todo editable durante el día; un registro por tabla por fecha (upsert).
- **Semana:** el agregado de `useSemanaBienestar` con navegación de semanas: minutos por actividad en barras con su color, intensidad media, lugares, racha de check-ins, promedio de calidad de sueño y de ánimo (números en Philosopher).
- **Entrenos:** historial + formulario (actividad del catálogo o nueva, duración, lugar, intensidad 1–5 como selector de puntos, notas).
- **Nutrición:** historial de registros + gestión de suplementos (existencias y fecha de recompra; al llegar a la fecha aparece aviso en la sección).
- **Sueño:** historial con duración calculada (maneja cruce de medianoche), calidad, y % de cumplimiento del checklist de higiene por semana.
- **Sustancias:** registro simple y privado (sustancia, cantidad, contexto, notas) con historial por mes. Sin juicios en la interfaz: es una bitácora. Este dato jamás aparece en Panel, notificaciones ni resúmenes.

## Paso 4 — Integración
El check-in "¿entrené?" y las consultas tipo entreno del calendario se cruzan: un evento tipo entreno del día aparece sugerido en el check-in para confirmarlo como entrenamiento realizado con un toque.

## Cierre de fase (checklist)
- [ ] `npx tsc --noEmit` sin errores.
- [ ] Check-in completo de un día guarda en animo, sueno y nutricion; reabrirlo muestra lo capturado (upsert, no duplica).
- [ ] Sueño 23:30 → 06:45 calcula 7h15 correctamente.
- [ ] Semana agrega dos entrenos de distinta actividad con sus colores.
- [ ] Suplemento con recompra vencida muestra aviso.
- [ ] Verificado en web y Android.
- [ ] Commit y push a `master`.
