-- ── Tablas ──────────────────────────────────────────────────────────────────

create table if not exists public.dispositivos (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  plataforma  text        not null check (plataforma in ('android','ios_pwa','web')),
  token       text        not null,
  activo      boolean     not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, token)
);

create table if not exists public.alertas (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  origen_tabla text        not null,
  origen_id    uuid,
  mensaje      text        not null,
  dispara_en   timestamptz not null,
  enviada      boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.dispositivos enable row level security;
alter table public.alertas      enable row level security;

drop policy if exists "propios" on public.dispositivos;
create policy "propios" on public.dispositivos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "propios" on public.alertas;
create policy "propios" on public.alertas
  for select using (user_id = auth.uid());

-- ── Índice ───────────────────────────────────────────────────────────────────

create index if not exists idx_alertas_pendientes on public.alertas (enviada, dispara_en);

-- ── Helper: evita duplicados por (user_id, origen_tabla, origen_id, !enviada) ─

create or replace procedure public.insertar_alerta_si_no_existe(
  p_user_id      uuid,
  p_origen_tabla text,
  p_origen_id    uuid,
  p_mensaje      text,
  p_dispara_en   timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.alertas a
    where a.user_id      = p_user_id
      and a.origen_tabla = p_origen_tabla
      and a.origen_id    is not distinct from p_origen_id
      and a.enviada      = false
  ) then
    insert into public.alertas (user_id, origen_tabla, origen_id, mensaje, dispara_en)
    values (p_user_id, p_origen_tabla, p_origen_id, p_mensaje, p_dispara_en);
  end if;
end;
$$;

-- ── generar_alertas ──────────────────────────────────────────────────────────

create or replace function public.generar_alertas()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r      record;
  uid    uuid;
  hoy    date := current_date;
  manana date := current_date + 1;
  en_dos date := current_date + 2;
  -- timestamps en hora local (::timestamp at time zone interpreta como hora local → devuelve timestamptz UTC)
  ts_hoy    timestamptz := (hoy::text    || ' 08:00:00')::timestamp at time zone 'America/Mexico_City';
  ts_manana timestamptz := (manana::text || ' 08:00:00')::timestamp at time zone 'America/Mexico_City';
begin

  -- Regla 1: pendientes que vencen mañana
  for r in
    select id, user_id, titulo from public.pendientes
    where hecho = false and fecha_limite = manana
  loop
    call public.insertar_alerta_si_no_existe(
      r.user_id, 'pendientes', r.id,
      'Vence mañana: ' || r.titulo,
      ts_manana
    );
  end loop;

  -- Regla 2: cobranzas vencidas hoy (pendiente o parcial)
  for r in
    select id, user_id, cliente, concepto from public.cobranzas
    where estado in ('pendiente','parcial') and fecha_vencimiento <= hoy
  loop
    call public.insertar_alerta_si_no_existe(
      r.user_id, 'cobranzas', r.id,
      'Cobranza vencida: ' || r.cliente || ' — ' || r.concepto,
      ts_hoy
    );
  end loop;

  -- Regla 3: pagos programados en 2 días
  for r in
    select id, user_id, concepto, monto from public.pagos_programados
    where activo = true and proximo_pago = en_dos
  loop
    call public.insertar_alerta_si_no_existe(
      r.user_id, 'pagos_programados', r.id,
      'Pago próximo: ' || r.concepto || ' $' || r.monto::text,
      ts_manana
    );
  end loop;

  -- Regla 4: eventos de mañana (+ alerta 2h antes para entrevistas)
  for r in
    select id, user_id, titulo, hora, tipo from public.eventos
    where fecha = manana
  loop
    call public.insertar_alerta_si_no_existe(
      r.user_id, 'eventos', r.id,
      'Mañana: ' || r.titulo || coalesce(' a las ' || left(r.hora::text, 5), ''),
      ts_manana
    );
    if r.tipo = 'entrevista' and r.hora is not null then
      call public.insertar_alerta_si_no_existe(
        r.user_id, 'eventos_2h', r.id,
        '2h para tu entrevista: ' || r.titulo,
        ((manana::text || ' ' || left(r.hora::text, 5))::timestamp at time zone 'America/Mexico_City')
          - interval '2 hours'
      );
    end if;
  end loop;

  -- Regla 5: medicamentos activos — una alerta por horario del día
  for r in
    select m.id, m.user_id, m.nombre, h.horario
    from public.medicamentos m,
         jsonb_array_elements_text(m.horarios) as h(horario)
    where m.activo = true
  loop
    declare
      ts_toma timestamptz;
    begin
      ts_toma := ((hoy::text || ' ' || r.horario)::timestamp) at time zone 'America/Mexico_City';
      if not exists (
        select 1 from public.alertas a
        where a.user_id      = r.user_id
          and a.origen_tabla = 'medicamentos'
          and a.origen_id    = r.id
          and a.enviada      = false
          and date(a.dispara_en at time zone 'America/Mexico_City') = hoy
      ) then
        insert into public.alertas (user_id, origen_tabla, origen_id, mensaje, dispara_en)
        values (r.user_id, 'medicamentos', r.id,
          'Toma de ' || r.nombre || ' a las ' || r.horario, ts_toma);
      end if;
    end;
  end loop;

  -- Regla 6: predicción de ciclo a 2 días
  for uid in select distinct user_id from public.ciclo loop
    declare
      prom_dias     numeric;
      ultimo_inicio date;
      proximo       date;
    begin
      select avg(dif), max(inicio)
      into   prom_dias, ultimo_inicio
      from (
        select inicio,
          inicio - lag(inicio) over (order by inicio) as dif
        from public.ciclo
        where user_id = uid and fase = 'inicio'
      ) sub
      where dif is not null;

      if prom_dias is not null and ultimo_inicio is not null then
        proximo := ultimo_inicio + round(prom_dias)::int;
        if proximo = en_dos then
          call public.insertar_alerta_si_no_existe(
            uid, 'ciclo', null,
            'Recordatorio de calendario personal',
            ((en_dos::text || ' 08:00:00')::timestamp at time zone 'America/Mexico_City')
          );
        end if;
      end if;
    end;
  end loop;

  -- Regla 7: suplementos con recompra próxima o vencida
  for r in
    select id, user_id, nombre from public.suplementos
    where activo = true and recompra_fecha <= hoy
  loop
    call public.insertar_alerta_si_no_existe(
      r.user_id, 'suplementos', r.id,
      'Recomprar: ' || r.nombre,
      ts_hoy
    );
  end loop;

  -- Regla 8: sin sueño/ánimo por 3+ días (máximo una alerta cada 3 días)
  for uid in
    select distinct user_id from public.sueno
    union
    select distinct user_id from public.animo
  loop
    declare
      ultima_alerta date;
      ultimo_sueno  date;
      ultimo_animo  date;
    begin
      select max(date(created_at at time zone 'America/Mexico_City'))
      into   ultima_alerta
      from   public.alertas
      where  user_id = uid and origen_tabla = 'checkin' and enviada = false;

      if ultima_alerta is null or ultima_alerta < hoy - 3 then
        select max(fecha) into ultimo_sueno from public.sueno where user_id = uid;
        select max(fecha) into ultimo_animo from public.animo where user_id = uid;
        if (ultimo_sueno is null or ultimo_sueno < hoy - 3)
        and (ultimo_animo is null or ultimo_animo < hoy - 3) then
          call public.insertar_alerta_si_no_existe(
            uid, 'checkin', null,
            '¿Hacemos tu check-in? Llevas unos días sin registrar',
            ts_hoy + interval '9 hours'
          );
        end if;
      end if;
    end;
  end loop;

end;
$$;

revoke execute on function  public.generar_alertas() from anon, authenticated;
revoke execute on procedure public.insertar_alerta_si_no_existe(uuid,text,uuid,text,timestamptz)
  from anon, authenticated;

-- ── pg_cron (ejecutar DESPUÉS de habilitar la extensión pg_cron en el Dashboard) ──
-- select cron.schedule('generar-alertas', '*/15 * * * *', $$ select public.generar_alertas(); $$);
