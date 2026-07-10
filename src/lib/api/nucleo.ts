import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAviso } from '../../components/Aviso';
import type { ContextoClave, Evento, Nota, Pendiente, Proyecto } from '../../types/nucleo';

const ESTADO_ORDEN = { activo: 0, pausado: 1, completado: 2 } as const;
const PRIORIDAD_ORDEN = { alta: 0, media: 1, baja: 2 } as const;

export type FiltrosPendientes = {
  hecho?: boolean;
  contexto?: ContextoClave;
};

export type RangoFechas = { desde: string; hasta: string };

// ── PROYECTOS ──────────────────────────────────────────────────────────────

export function useProyectos() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proyectos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Proyecto[]).sort(
        (a, b) => ESTADO_ORDEN[a.estado] - ESTADO_ORDEN[b.estado],
      );
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearProyecto() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      datos: Omit<Proyecto, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    ) => {
      const { error } = await supabase.from('proyectos').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proyectos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarProyecto() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Proyecto> & { id: string }) => {
      const { error } = await supabase.from('proyectos').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proyectos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarProyecto() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proyectos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── PENDIENTES ─────────────────────────────────────────────────────────────

export function usePendientes(filtros: FiltrosPendientes = {}) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['pendientes', filtros],
    queryFn: async () => {
      let q = supabase
        .from('pendientes')
        .select('*')
        .order('fecha_limite', { ascending: true, nullsFirst: false });
      if (filtros.hecho !== undefined) q = q.eq('hecho', filtros.hecho);
      if (filtros.contexto) q = q.eq('contexto', filtros.contexto);
      const { data, error } = await q;
      if (error) throw error;
      return (data as Pendiente[]).sort(
        (a, b) => PRIORIDAD_ORDEN[a.prioridad] - PRIORIDAD_ORDEN[b.prioridad],
      );
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearPendiente() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      datos: Omit<Pendiente, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    ) => {
      const { error } = await supabase.from('pendientes').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendientes'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarPendiente() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Pendiente> & { id: string }) => {
      const { error } = await supabase.from('pendientes').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendientes'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarPendiente() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pendientes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendientes'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useToggleHecho() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hecho }: { id: string; hecho: boolean }) => {
      const { error } = await supabase.from('pendientes').update({ hecho }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendientes'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── NOTAS ──────────────────────────────────────────────────────────────────

export function useNotas() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['notas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Nota[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearNota() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      datos: Omit<Nota, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    ) => {
      const { error } = await supabase.from('notas').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarNota() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── EVENTOS ────────────────────────────────────────────────────────────────

export function useEventos(rango?: RangoFechas) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['eventos', rango],
    queryFn: async () => {
      let q = supabase
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true, nullsFirst: true });
      if (rango) q = q.gte('fecha', rango.desde).lte('fecha', rango.hasta);
      const { data, error } = await q;
      if (error) throw error;
      return data as Evento[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearEvento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      datos: Omit<Evento, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    ) => {
      const { error } = await supabase.from('eventos').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eventos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarEvento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Evento> & { id: string }) => {
      const { error } = await supabase.from('eventos').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eventos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarEvento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('eventos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['eventos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}
