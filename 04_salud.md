# 04_salud.md — Fase 4 de full_emms
## Salud: ciclo, medicamentos, médicos, procedimientos y presupuestos médicos

**Para Claude Code.** Requiere Fases 0–3 cerradas.

## Paso 0 — Verificación (obligatorio)
Verifica que existan las 12 tablas de fases anteriores en los tipos, `ModalFormulario`, el patrón de pills por sección usado en finanzas, y la tabla `metas` con etiqueta `medica`. Si algo difiere, DETENTE y reporta desviaciones.

## Reglas de esta sesión
Un paso a la vez, `npx tsc --noEmit` tras cada bloque, sin comentarios inline, pasos manuales con confirmación, commit y push a `master`.

---

## Paso 1 — Migración
CREA `supabase/migrations/0003_salud.sql`:

```sql
create table public.ciclo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha_inicio date not null,
  duracion_dias smallint,
  sintomas jsonb not null default '[]'::jsonb,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medicamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  dosis text not null,
  frecuencia text not null,
  horarios jsonb not null default '[]'::jsonb,
  activo boolean not null default true,
  motivo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tomas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  medicamento_id uuid not null references public.medicamentos(id) on delete cascade,
  fecha date not null default current_date,
  horario text not null,
  tomada boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  especialidad text not null,
  telefono text,
  consultorio text,
  tarifa_consulta numeric(12,2),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.procedimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('cirugia','estetica','laser','podologia','dental','estudio','otro')),
  medico_id uuid references public.medicos(id) on delete set null,
  fecha_tentativa date,
  estado text not null default 'explorando' check (estado in ('explorando','cotizado','agendado','realizado','descartado')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.presupuestos_medicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  procedimiento_id uuid not null references public.procedimientos(id) on delete cascade,
  concepto text not null,
  monto numeric(12,2) not null,
  incluye jsonb not null default '[]'::jsonb,
  vigencia date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['ciclo','medicamentos','tomas','medicos','procedimientos','presupuestos_medicos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "propios" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create trigger t_%I before update on public.%I for each row execute function public.tocar_updated_at()', t, t);
  end loop;
end $$;

create index idx_ciclo_user_fecha on public.ciclo (user_id, fecha_inicio desc);
create index idx_tomas_user_fecha on public.tomas (user_id, fecha);
```

**Paso manual para la usuaria:** correr en el SQL Editor y confirmar las 6 tablas.

## Paso 2 — Tipos y capa de datos
CREA `src/types/salud.ts` y `src/lib/api/salud.ts`. Lógica de predicción de ciclo en `src/lib/ciclo.ts`: promedio de intervalo de los últimos 6 registros → próxima fecha estimada y días restantes; con menos de 2 registros no se predice.

## Paso 3 — Pestaña Salud
EDITA `app/(tabs)/salud.tsx`: pills — **Hoy | Ciclo | Medicamentos | Procedimientos | Médicos** — acento `LAVANDA.rosaLavanda`.

- **Hoy:** tomas de medicamentos activos del día como checklist por horario (marcar crea registro en `tomas`); tarjeta de ciclo con predicción ("próximo periodo estimado: 14 jul · en 7 días"); consultas de hoy (eventos tipo consulta).
- **Ciclo:** botón grande "registró hoy" que crea inicio con fecha de hoy (editable), historial con duración e intervalo, síntomas como chips seleccionables (catálogo: cólico, migraña, fatiga, hinchazón, cambios de ánimo + libre), duración promedio e intervalo promedio arriba.
- **Medicamentos:** activos y suspendidos separados (suspendidos atenuados con etiqueta vino, patrón del PDF clínico), formulario con horarios múltiples (agregar hora), historial de adherencia de los últimos 7 días como puntos salvia/vino.
- **Procedimientos:** tarjetas por estado (explorando malva gris, cotizado caramelo, agendado pizarra, realizado salvia, descartado atenuado). Detalle de procedimiento: datos, médico ligado, **presupuesto**: partidas (concepto, monto, incluye como chips, vigencia) con TOTAL en Philosopher granate; botón "agendar consulta" que crea un `evento` tipo consulta con `vinculo_id` = procedimiento y lo muestra ligado; botón "crear meta de ahorro" que crea una `meta` etiqueta medica con el total del presupuesto como objetivo.
- **Médicos:** directorio con especialidad, teléfono (tocar llama), consultorio, tarifa; desde la ficha del médico se puede agendar consulta directa (evento tipo consulta).

## Paso 4 — Integración Panel
En el Panel: si hay predicción de ciclo a 3 días o menos, o tomas pendientes hoy, mostrar tarjeta discreta de salud (sin detalle del dato en el título, solo "Salud: 2 recordatorios" — el detalle se ve al entrar). Privacidad primero en la pantalla más pública de la app.

## Cierre de fase (checklist)
- [ ] `npx tsc --noEmit` sin errores.
- [ ] Dos registros de ciclo generan predicción coherente.
- [ ] Medicamento con 2 horarios aparece dos veces en el checklist de Hoy y las tomas se registran.
- [ ] Procedimiento con 3 partidas de presupuesto muestra el total correcto; "agendar consulta" crea el evento ligado y se ve en el Calendario; "crear meta de ahorro" aparece en Finanzas → Metas.
- [ ] Verificado en web y Android.
- [ ] Commit y push a `master`.
