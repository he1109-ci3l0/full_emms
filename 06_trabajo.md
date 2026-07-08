# 06_trabajo.md — Fase 6 de full_emms
## Trabajo: contratos y entrevistas

**Para Claude Code.** Requiere Fases 0–5 cerradas.

## Paso 0 — Verificación (obligatorio)
Verifica tablas y tipos de fases anteriores, el formulario de eventos del calendario y el patrón de pills. Si algo difiere, DETENTE y reporta desviaciones.

## Reglas de esta sesión
Un paso a la vez, `npx tsc --noEmit` tras cada bloque, sin comentarios inline, pasos manuales con confirmación, commit y push a `master`.

---

## Paso 1 — Migración
CREA `supabase/migrations/0005_trabajo.sql`:

```sql
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente text not null,
  rol text not null,
  tipo text not null check (tipo in ('consultoria','nomina','proyecto','iguala')),
  inicio date not null,
  fin date,
  tarifa numeric(14,2),
  periodicidad_tarifa text check (periodicidad_tarifa in ('hora','proyecto','mensual')),
  estado text not null default 'activo' check (estado in ('prospecto','activo','terminado')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entrevistas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  empresa text not null,
  puesto text not null,
  fecha date not null,
  hora time,
  medio text not null default 'videollamada' check (medio in ('presencial','videollamada','telefonica')),
  etapa text not null default 'primera' check (etapa in ('screening','primera','tecnica','final','oferta')),
  resultado text check (resultado in ('pendiente','avanzo','rechazada','oferta_recibida','declinada')),
  evento_id uuid references public.eventos(id) on delete set null,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['contratos','entrevistas'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "propios" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create trigger t_%I before update on public.%I for each row execute function public.tocar_updated_at()', t, t);
  end loop;
end $$;
```

**Paso manual para la usuaria:** correr en el SQL Editor y confirmar las 2 tablas.

## Paso 2 — Tipos y capa de datos
CREA `src/types/trabajo.ts` y `src/lib/api/trabajo.ts`. Regla de integración: al crear o reprogramar una entrevista, la mutación crea/actualiza automáticamente su `evento` tipo entrevista (mismo título "Entrevista {empresa} — {puesto}", fecha, hora) y guarda `evento_id`; al borrar la entrevista se borra su evento. La sincronización vive en la capa de datos, no en la interfaz.

## Paso 3 — Pestaña Trabajo
EDITA `app/(tabs)/trabajo.tsx`: pills — **Panorama | Contratos | Entrevistas** — acento `SUCULENTAS.pizarra`.

- **Panorama:** dónde estás contratada hoy (contratos activos con cliente, rol y tarifa), entrevistas próximas (esta semana con día y hora), y KPIs: contratos activos, entrevistas programadas, ofertas abiertas.
- **Contratos:** tarjetas por estado (prospecto caramelo, activo salvia, terminado atenuado) con cliente en Philosopher, rol, tipo, vigencia y tarifa; formulario completo.
- **Entrevistas:** pipeline agrupado por etapa (screening → primera → técnica → final → oferta); tarjeta con empresa, puesto, fecha/hora, medio, resultado con color (avanzó salvia, pendiente caramelo, rechazada atenuado, oferta recibida granate); formulario completo. Al marcar resultado "avanzó" se ofrece crear la siguiente etapa con un toque.

## Paso 4 — Integración Panel
En el Panel: si hay entrevista hoy o mañana, tarjeta "Entrevista {empresa} — {día} {hora}" con acceso directo.

## Cierre de fase (checklist)
- [ ] `npx tsc --noEmit` sin errores.
- [ ] Crear entrevista genera su evento visible en el Calendario; reprogramarla mueve el evento; borrarla lo elimina.
- [ ] Marcar "avanzó" ofrece y crea la siguiente etapa.
- [ ] Contrato activo aparece en Panorama con su tarifa.
- [ ] Verificado en web y Android.
- [ ] Commit y push a `master`.
