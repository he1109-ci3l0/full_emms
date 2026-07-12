import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAviso } from '../../components/Aviso';
import type { Contrato, Entrevista } from '../../types/trabajo';

// ── CONTRATOS ──────────────────────────────────────────────────────────────

export function useContratos() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['contratos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .order('inicio', { ascending: false });
      if (error) throw error;
      return data as Contrato[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearContrato() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Contrato, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('contratos').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarContrato() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Contrato> & { id: string }) => {
      const { error } = await supabase.from('contratos').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarContrato() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contratos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contratos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── ENTREVISTAS ────────────────────────────────────────────────────────────

export function useEntrevistas() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['entrevistas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entrevistas')
        .select('*')
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data as Entrevista[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

async function sincronizarEvento(entrevista: {
  empresa: string;
  puesto: string;
  fecha: string;
  hora: string | null;
  evento_id: string | null;
}): Promise<string | null> {
  const titulo = `Entrevista ${entrevista.empresa} — ${entrevista.puesto}`;
  const payload = {
    titulo,
    fecha: entrevista.fecha,
    hora: entrevista.hora,
    tipo: 'entrevista' as const,
    contexto: 'consultoria' as const,
    duracion_min: 60,
    lugar: null,
    vinculo_id: null,
  };

  if (entrevista.evento_id) {
    await supabase.from('eventos').update(payload).eq('id', entrevista.evento_id);
    return entrevista.evento_id;
  }

  const { data, error } = await supabase.from('eventos').insert(payload).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export function useCrearEntrevista() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Entrevista, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const evento_id = await sincronizarEvento({
        empresa: datos.empresa,
        puesto: datos.puesto,
        fecha: datos.fecha,
        hora: datos.hora,
        evento_id: null,
      });
      const { error } = await supabase.from('entrevistas').insert({ ...datos, evento_id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entrevistas'] });
      qc.invalidateQueries({ queryKey: ['eventos'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarEntrevista() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Entrevista> & { id: string; empresa: string; puesto: string; fecha: string; hora: string | null; evento_id: string | null }) => {
      const evento_id = await sincronizarEvento({
        empresa: datos.empresa,
        puesto: datos.puesto,
        fecha: datos.fecha,
        hora: datos.hora,
        evento_id: datos.evento_id,
      });
      const { error } = await supabase.from('entrevistas').update({ ...datos, evento_id }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entrevistas'] });
      qc.invalidateQueries({ queryKey: ['eventos'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarEntrevista() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, evento_id }: { id: string; evento_id: string | null }) => {
      if (evento_id) {
        await supabase.from('eventos').delete().eq('id', evento_id);
      }
      const { error } = await supabase.from('entrevistas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entrevistas'] });
      qc.invalidateQueries({ queryKey: ['eventos'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}
