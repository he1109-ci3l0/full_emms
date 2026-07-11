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

create or replace function public.buscar_chats(q text)
returns setof public.conversaciones
language sql
security definer
set search_path = public
as $$
  select distinct c.*
  from public.conversaciones c
  left join public.mensajes m on m.conversacion_id = c.id
  where c.user_id = auth.uid()
    and (
      to_tsvector('spanish', c.asunto) @@ plainto_tsquery('spanish', q)
      or (m.id is not null and to_tsvector('spanish', m.texto) @@ plainto_tsquery('spanish', q))
    )
  order by c.ultima_actividad desc;
$$;
