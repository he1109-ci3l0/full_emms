# 03_finanzas.md — Fase 3 de full_emms
## Dinero: cuentas, movimientos, cobranza, pagos, metas, deudas, inversión, crédito

**Para Claude Code.** Requiere Fases 0–2 cerradas.

## Paso 0 — Verificación (obligatorio)
Antes de tocar nada: verifica que existan `src/lib/api/nucleo.ts`, `src/components/ModalFormulario.tsx`, `ChipContexto.tsx`, `FABMono.tsx`, `Tarjeta.tsx`, la pestaña calendario funcional, y las 4 tablas núcleo en los tipos. Si algo difiere de lo especificado en las fases 0–2, DETENTE y entrega un reporte de desviaciones a la usuaria en vez de continuar.

## Reglas de esta sesión
Un paso a la vez, `npx tsc --noEmit` tras cada bloque, sin comentarios inline, pasos manuales con confirmación, commit y push a `master` al cerrar.

---

## Paso 1 — Migración
CREA `supabase/migrations/0002_finanzas.sql`:

```sql
create table public.cuentas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('efectivo','debito','credito','inversion','ahorro')),
  saldo_inicial numeric(14,2) not null default 0,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cuenta_id uuid not null references public.cuentas(id) on delete cascade,
  tipo text not null check (tipo in ('ingreso','gasto','transferencia')),
  monto numeric(14,2) not null check (monto > 0),
  categoria text not null default 'general',
  fecha date not null default current_date,
  concepto text,
  contexto text not null default 'personal',
  cuenta_destino_id uuid references public.cuentas(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cobranzas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  deudor text not null,
  concepto text not null,
  monto numeric(14,2) not null,
  monto_pagado numeric(14,2) not null default 0,
  fecha_limite date,
  estado text not null default 'pendiente' check (estado in ('pendiente','parcial','pagado','vencido')),
  contexto text not null default 'antioquia',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pagos_programados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  acreedor text not null,
  concepto text not null,
  monto numeric(14,2) not null,
  fecha_limite date not null,
  recurrencia text check (recurrencia in ('mensual','quincenal','anual')),
  estado text not null default 'pendiente' check (estado in ('pendiente','pagado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  etiqueta text not null default 'general' check (etiqueta in ('general','medica','viaje','equipo','colchon')),
  monto_objetivo numeric(14,2) not null,
  monto_actual numeric(14,2) not null default 0,
  fecha_objetivo date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deudas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  acreedor text not null,
  monto_original numeric(14,2) not null,
  saldo numeric(14,2) not null,
  tasa_anual numeric(6,2),
  pago_minimo numeric(14,2),
  fecha_corte smallint check (fecha_corte between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inversiones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  instrumento text not null,
  monto numeric(14,2) not null,
  fecha_entrada date not null,
  rendimiento_esperado numeric(6,2),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.historial_crediticio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha_consulta date not null default current_date,
  buro text not null,
  score integer,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['cuentas','movimientos','cobranzas','pagos_programados','metas','deudas','inversiones','historial_crediticio'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "propios" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create trigger t_%I before update on public.%I for each row execute function public.tocar_updated_at()', t, t);
  end loop;
end $$;

create index idx_movimientos_user_fecha on public.movimientos (user_id, fecha desc);
create index idx_cobranzas_user_estado on public.cobranzas (user_id, estado, fecha_limite);
```

**Paso manual para la usuaria:** pegar y correr el archivo completo en el SQL Editor del dashboard. Confirmar Success y que las 8 tablas existen antes de continuar.

## Paso 2 — Tipos y capa de datos
CREA `src/types/finanzas.ts` (espejo de tablas) y `src/lib/api/finanzas.ts` con hooks: cuentas con saldo calculado (saldo_inicial + ingresos − gastos ± transferencias), movimientos por mes, cobranzas por estado, pagos próximos, metas con % de avance, deudas con saldo total, inversiones, último score. Mutaciones CRUD por tabla. Al registrar pago de cobranza: actualizar `monto_pagado` y recalcular `estado` (parcial/pagado). Un job de lectura marca como `vencido` lo pendiente con fecha pasada (cálculo en cliente, no en base).

## Paso 3 — Estructura de la pestaña
EDITA `app/(tabs)/finanzas.tsx`: pills con scroll horizontal — **Resumen | Movimientos | Cobranza | Pagos | Metas | Deudas | Inversión | Crédito** — acento del módulo `LAVANDA.aqua`.

## Paso 4 — Resumen
KPIs: saldo total (pizarra), gastos del mes (vino), por cobrar vencido (granate), pagos próximos 7 días (caramelo). Debajo: gasto del mes por categoría (barras horizontales con los colores de contextos) y lista de cuentas con saldo.

## Paso 5 — Secciones
- **Movimientos:** lista por mes con navegación, filtros por tipo/categoría/contexto; formulario: tipo, cuenta, monto, categoría (catálogo editable en `src/lib/categorias.ts`: renta, súper, transporte, salud, estética, entreno, suscripciones, software, hogar, general + libre), fecha, concepto, contexto; transferencia pide cuenta destino.
- **Cobranza:** tarjetas por deudor (pensado para "Hab 01"–"Hab 14" de Antioquia 43 pero libre), estado con color (pendiente caramelo, parcial aqua, pagado salvia, vencido vino), botón "registrar pago" con monto; total por cobrar arriba.
- **Pagos:** lista por fecha límite; al marcar pagado con recurrencia, crear automáticamente el siguiente periodo.
- **Metas:** tarjetas con barra de progreso en el color de la etiqueta (médica = rosa lavanda), botón "abonar" que además registra el movimiento como gasto categoría ahorro si la usuaria lo confirma.
- **Deudas:** tarjetas acreedor/saldo/tasa/pago mínimo/fecha de corte, total arriba en vino.
- **Inversión:** lista simple con monto y rendimiento esperado.
- **Crédito:** historial de scores con mini-gráfica de línea (sin librerías nuevas: SVG con react-native-svg solo si ya está; si no, barras simples) y registro manual.

## Cierre de fase (checklist)
- [ ] `npx tsc --noEmit` sin errores.
- [ ] Alta de cuenta, movimiento de gasto e ingreso: el saldo de la cuenta refleja ambos.
- [ ] Cobranza: crear adeudo, registrar pago parcial (estado parcial), completar (pagado).
- [ ] Pago recurrente mensual marcado como pagado genera el del mes siguiente.
- [ ] Meta con abono actualiza su % de avance.
- [ ] Todo verificado en web y Android.
- [ ] Commit y push a `master`.
