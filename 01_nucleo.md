# 01_nucleo.md — Fase 1 de full_emms
## Tablas núcleo, CRUD y migración desde el Gabinete

**Para Claude Code.** Requiere Fase 0 cerrada (checklist de `00_setup.md` completo). Si el repo no coincide con lo que la Fase 0 especifica, detente y repórtalo antes de tocar nada.

## Reglas de esta sesión
Las mismas de `00_setup.md`: un paso a la vez, `npx tsc --noEmit` tras cada bloque, sin comentarios inline, pasos manuales se indican y se espera confirmación, commit y push a `master` al cerrar.

---

## Paso 1 — Migración SQL del núcleo
CREA `supabase/migrations/0001_nucleo.sql` con exactamente esto:

```sql
create or replace function public.tocar_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  contexto text not null default 'personal',
  estado text not null default 'activo' check (estado in ('activo','pausado','completado')),
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pendientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null,
  contexto text not null default 'personal',
  prioridad text not null default 'media' check (prioridad in ('alta','media','baja')),
  fecha_limite date,
  hecho boolean not null default false,
  proyecto_id uuid references public.proyectos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null,
  fecha date not null,
  hora time,
  duracion_min integer,
  contexto text not null default 'personal',
  lugar text,
  tipo text not null default 'otro' check (tipo in ('cita','entrevista','consulta','entreno','otro')),
  vinculo_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  texto text not null,
  contexto text not null default 'personal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.proyectos enable row level security;
alter table public.pendientes enable row level security;
alter table public.eventos enable row level security;
alter table public.notas enable row level security;

create policy "propios" on public.proyectos for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on public.pendientes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on public.eventos for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on public.notas for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger t_proyectos before update on public.proyectos for each row execute function public.tocar_updated_at();
create trigger t_pendientes before update on public.pendientes for each row execute function public.tocar_updated_at();
create trigger t_eventos before update on public.eventos for each row execute function public.tocar_updated_at();
create trigger t_notas before update on public.notas for each row execute function public.tocar_updated_at();

create index idx_pendientes_user_fecha on public.pendientes (user_id, hecho, fecha_limite);
create index idx_eventos_user_fecha on public.eventos (user_id, fecha);
```

**Paso manual para la usuaria (navegador):** dashboard de Supabase → SQL Editor → New query → pegar el contenido completo del archivo → Run. Confirmar que dice Success y que las 4 tablas aparecen en Table Editor. No continuar sin esta confirmación.

## Paso 2 — Tipos y catálogo de contextos
CREA `src/types/nucleo.ts` con los tipos `Proyecto`, `Pendiente`, `Evento`, `Nota` espejo exacto de las tablas.

CREA `src/lib/contextos.ts`: catálogo tipado de contextos con su color, reutilizando el tema:
portafolio → `SUCULENTAS.malva`, antioquia → `SUCULENTAS.pizarra`, cipreses → `HOJAS.salvia`, consultoria → `LAVANDA.aqua`, legal → `HOJAS.ciruela`, bootcamp → `HOJAS.caramelo`, personal → `LAVANDA.rosaLavanda`. Exportar también etiquetas legibles ("Antioquia 43", "Legal / PROFECO", etc.).

## Paso 3 — Capa de datos
CREA `src/lib/api/nucleo.ts` con hooks de TanStack Query sobre el cliente de Supabase:
- `useProyectos()`, `usePendientes(filtros)`, `useNotas()`, `useEventos(rango)` — lecturas ordenadas (pendientes: fecha_limite asc nulls last, luego prioridad).
- Mutaciones con invalidación: crear/editar/borrar por tabla, `toggleHecho(id)`.
Errores de red se muestran con un aviso flotante (crear `src/components/Aviso.tsx`, pill tinta con texto crema, igual al prototipo).

## Paso 4 — Componentes compartidos
CREA en `src/components/`:
- `ChipContexto.tsx` y `ChipPrioridad.tsx` (pills Nobile mayúsculas; prioridad alta `HOJAS.vino`, media `HOJAS.caramelo`, baja `HOJAS.malvaGris` con texto carbón).
- `FABMono.tsx`: botón flotante circular con `mono_copa.jpg`, borde 4px vino, sombra, escala al presionar; recibe `onPress` y tooltip.
- `ModalFormulario.tsx`: modal centrado estilo prototipo (hueso, borde superior caramelo, campos con fondo crema) que recibe children y acciones Guardar/Cancelar/Borrar.
- `FilaPendiente.tsx`: check cuadrado redondeado, título, chips, fecha (en vino + "vencido" si pasada y no hecha), botón editar.

## Paso 5 — Pantalla Pendientes
EDITA `app/(tabs)/pendientes.tsx`:
- Filtros pill: Activos/Hechos + Todos + un pill por contexto (activo en ciruela oscura con texto hueso).
- Lista con `FilaPendiente`; vacío muestra el mensaje en Zeyada salvia.
- `FABMono` abre `ModalFormulario` con: qué hay que hacer, contexto (selector), prioridad, fecha límite opcional, proyecto opcional (selector de proyectos activos).

## Paso 6 — Pantalla Proyectos
EDITA `app/(tabs)/proyectos.tsx`: tarjetas con borde izquierdo 6px del color del contexto, nombre en Philosopher, estado en etiqueta Nobile, chip de contexto, nota de avance, orden activo→pausado→completado, editar/crear con `ModalFormulario`.

## Paso 7 — Panel y Notas
EDITA `app/(tabs)/index.tsx` (Panel):
- 4 KPIs con los colores del prototipo: vencidos (vino), vencen en 7 días (caramelo), pendientes activos (pizarra), proyectos activos (ciruela oscura). Números en Philosopher con animación de conteo (Reanimated).
- Sección "Próximos vencimientos" (5 con fecha más cercana) y sección "Últimas notas" (3 más recientes) con acceso a la pantalla completa de notas.

CREA `app/notas.tsx` (ruta stack fuera de tabs): captura rápida arriba (textarea + contexto + guardar), lista en tarjetas rosa pálido con fecha/hora en etiqueta, borrar con confirmación. El FAB del Panel abre la captura rápida de nota.

## Paso 8 — Respaldo e importador del Gabinete
CREA `app/respaldo.tsx` (ruta stack), accesible desde un botón con `mono_sombrero.jpg` en `BarraMorris`:
- **Importar:** `expo-document-picker` para elegir el JSON exportado por el Gabinete HTML (`{proyectos, pendientes, eventos, notas}` con ids locales, contextos ya coincidentes, notas con campo `cuando` que se descarta usando `created_at` actual). Insertar en lote, reportar conteos por tabla, y no duplicar si se importa dos veces (verificar por título+fecha antes de insertar).
- **Exportar:** descarga/comparte un JSON con todo el contenido actual de las 4 tablas (en web, descarga de archivo; en nativo, `expo-sharing`).

## Cierre de fase (checklist)
- [ ] `npx tsc --noEmit` sin errores.
- [ ] Web y Android: crear, editar, marcar y borrar pendientes, proyectos y notas; los cambios de un dispositivo aparecen en el otro al recargar.
- [ ] Panel muestra KPIs correctos contra los datos reales.
- [ ] JSON del Gabinete importado: los 5 pendientes y 5 proyectos semilla aparecen; segunda importación no duplica.
- [ ] Prueba de RLS: en el SQL Editor, `select count(*) from pendientes;` como rol anon (sin sesión) devuelve 0 filas.
- [ ] Commit y push a `master`.

Al pasar el checklist, confirmar en el chat de planeación para recibir `02_calendario.md`.
