import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAviso } from '../../components/Aviso';
import type {
  AccionAgente,
  Conversacion,
  Mensaje,
  RespuestaSecretaria,
} from '../../types/secretaria';

// ── Preferencias ────────────────────────────────────────────────────────────

export function usePreferencias() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['preferencias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('preferencias')
        .select('datos')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return (data?.datos ?? {}) as Record<string, unknown>;
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useGuardarPreferencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Record<string, unknown>) => {
      const { error } = await supabase.from('preferencias').upsert({ datos });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['preferencias'] }),
  });
}

// ── Conversaciones ──────────────────────────────────────────────────────────

export function useConversaciones() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['conversaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversaciones')
        .select('*')
        .order('ultima_actividad', { ascending: false });
      if (error) throw error;
      return data as Conversacion[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearConversacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<Conversacion> => {
      const { data, error } = await supabase
        .from('conversaciones')
        .insert({ asunto: 'Conversación nueva' })
        .select('*')
        .single();
      if (error) throw error;
      return data as Conversacion;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversaciones'] }),
  });
}

// ── Mensajes ────────────────────────────────────────────────────────────────

export function useMensajes(conversacionId: string | null) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['mensajes', conversacionId],
    enabled: !!conversacionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('conversacion_id', conversacionId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Mensaje[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

// ── Acciones ────────────────────────────────────────────────────────────────

export function useAccionesPendientes() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['acciones_agente', 'propuesta'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acciones_agente')
        .select('*')
        .eq('estado', 'propuesta')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AccionAgente[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

// ── Llamada a la Edge Function ──────────────────────────────────────────────

async function llamarSecretaria(
  conversacion_id: string,
  mensaje: string,
): Promise<RespuestaSecretaria> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('sin sesión');

  const { data: urlData } = supabase.storage.from('').getPublicUrl('');
  const baseUrl = (urlData.publicUrl as string).replace('/storage/v1/object/public/', '');
  const fnUrl = `${baseUrl}/functions/v1/secretaria`;

  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversacion_id, mensaje }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }
  return res.json() as Promise<RespuestaSecretaria>;
}

async function confirmarAccion(accion_id: string): Promise<{ ok: boolean; registro_id: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('sin sesión');

  const { data: urlData } = supabase.storage.from('').getPublicUrl('');
  const baseUrl = (urlData.publicUrl as string).replace('/storage/v1/object/public/', '');
  const fnUrl = `${baseUrl}/functions/v1/secretaria`;

  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ accion: 'confirmar', accion_id }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json() as Promise<{ ok: boolean; registro_id: string }>;
}

async function rechazarAccion(accion_id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('sin sesión');

  const { data: urlData } = supabase.storage.from('').getPublicUrl('');
  const baseUrl = (urlData.publicUrl as string).replace('/storage/v1/object/public/', '');
  const fnUrl = `${baseUrl}/functions/v1/secretaria`;

  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ accion: 'rechazar', accion_id }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
}

export function useEnviarMensaje() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversacion_id, mensaje }: { conversacion_id: string; mensaje: string }) =>
      llamarSecretaria(conversacion_id, mensaje),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['mensajes', vars.conversacion_id] });
      qc.invalidateQueries({ queryKey: ['conversaciones'] });
      qc.invalidateQueries({ queryKey: ['acciones_agente'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useConfirmarAccion() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accion_id: string) => confirmarAccion(accion_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['acciones_agente'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useRechazarAccion() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accion_id: string) => rechazarAccion(accion_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['acciones_agente'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── Búsqueda de chats ──────────────────────────────────────────────────────

export function useBuscarChats(q: string, desde?: string, hasta?: string) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['buscar_chats', q, desde, hasta],
    enabled: q.length >= 2 || !!(desde || hasta),
    queryFn: async () => {
      if (q.length >= 2) {
        const { data, error } = await supabase.rpc('buscar_chats', { q });
        if (error) throw error;
        return data as Conversacion[];
      }
      let query = supabase
        .from('conversaciones')
        .select('*')
        .order('ultima_actividad', { ascending: false });
      if (desde) query = query.gte('ultima_actividad', desde);
      if (hasta) query = query.lte('ultima_actividad', hasta + 'T23:59:59');
      const { data, error } = await query;
      if (error) throw error;
      return data as Conversacion[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}
