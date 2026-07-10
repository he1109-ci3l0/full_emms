-- limpieza por si existía una versión incompleta
drop table if exists public.notas    cascade;
drop table if exists public.eventos  cascade;
drop table if exists public.pendientes cascade;
drop table if exists public.proyectos  cascade;
drop function if exists public.tocar_updated_at() cascade;

-- trigger updated_at
create function public.tocar_updated_at()
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

alter table public.proyectos  enable row level security;
alter table public.pendientes enable row level security;
alter table public.eventos    enable row level security;
alter table public.notas      enable row level security;

create policy "propios" on public.proyectos  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on public.pendientes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on public.eventos    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "propios" on public.notas      for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger t_proyectos  before update on public.proyectos  for each row execute function public.tocar_updated_at();
create trigger t_pendientes before update on public.pendientes for each row execute function public.tocar_updated_at();
create trigger t_eventos    before update on public.eventos    for each row execute function public.tocar_updated_at();
create trigger t_notas      before update on public.notas      for each row execute function public.tocar_updated_at();

create index idx_pendientes_user_fecha on public.pendientes (user_id, hecho, fecha_limite);
create index idx_eventos_user_fecha    on public.eventos    (user_id, fecha);
