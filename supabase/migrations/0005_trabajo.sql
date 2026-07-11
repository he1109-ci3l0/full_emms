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
