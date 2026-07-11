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
