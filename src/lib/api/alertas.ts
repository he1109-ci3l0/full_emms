import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAviso } from '../../components/Aviso';
import type { Alerta } from '../../types/alertas';

const DIAS_HISTORIAL = 7;

export function useAlertas() {
  const aviso = useAviso();
  const desde = new Date(Date.now() - DIAS_HISTORIAL * 24 * 60 * 60 * 1000).toISOString();
  const result = useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alertas')
        .select('*')
        .gte('created_at', desde)
        .order('dispara_en', { ascending: false });
      if (error) throw error;
      return data as Alerta[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useRegistrarDispositivo() {
  const aviso = useAviso();
  return useMutation({
    mutationFn: async ({ plataforma, token }: { plataforma: 'android' | 'ios_pwa' | 'web'; token: string }) => {
      const { error } = await supabase
        .from('dispositivos')
        .upsert({ plataforma, token, activo: true }, { onConflict: 'user_id,token' });
      if (error) throw error;
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useAlertasNoVistas(alertas: Alerta[], vistaHasta: string | null): number {
  if (!vistaHasta) return alertas.length;
  return alertas.filter((a) => a.created_at > vistaHasta).length;
}
