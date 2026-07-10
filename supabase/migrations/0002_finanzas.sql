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
