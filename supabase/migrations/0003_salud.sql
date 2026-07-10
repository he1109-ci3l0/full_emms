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
