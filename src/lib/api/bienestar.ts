import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAviso } from '../../components/Aviso';
import { aISO, deFechaISO } from '../fechas';
import type {
  Animo,
  Entrenamiento,
  Nutricion,
  SemanaBienestar,
  Sueno,
  Suplemento,
  Sustancia,
} from '../../types/bienestar';

// ── Helpers ────────────────────────────────────────────────────────────────

function jsonArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// ── ENTRENAMIENTOS ─────────────────────────────────────────────────────────

export function useEntrenamientos(limite = 30) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['entrenamientos', limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entrenamientos')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(limite);
      if (error) throw error;
      return data as Entrenamiento[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearEntrenamiento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Entrenamiento, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('entrenamientos').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entrenamientos'] });
      qc.invalidateQueries({ queryKey: ['semana_bienestar'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarEntrenamiento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Entrenamiento> & { id: string }) => {
      const { error } = await supabase.from('entrenamientos').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entrenamientos'] });
      qc.invalidateQueries({ queryKey: ['semana_bienestar'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarEntrenamiento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('entrenamientos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entrenamientos'] });
      qc.invalidateQueries({ queryKey: ['semana_bienestar'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── ÁNIMO ──────────────────────────────────────────────────────────────────

export function useAnimoDia(fecha: string) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['animo_dia', fecha],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animo')
        .select('*')
        .eq('fecha', fecha)
        .maybeSingle();
      if (error) throw error;
      return data as Animo | null;
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useUpsertAnimo() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fecha, nivel, texto }: { fecha: string; nivel: number; texto: string | null }) => {
      const { data: existing } = await supabase.from('animo').select('id').eq('fecha', fecha).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('animo').update({ nivel, texto }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('animo').insert({ fecha, nivel, texto });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['animo_dia', vars.fecha] });
      qc.invalidateQueries({ queryKey: ['semana_bienestar'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── SUEÑO ──────────────────────────────────────────────────────────────────

export function useSuenoDia(fecha: string) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['sueno_dia', fecha],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sueno')
        .select('*')
        .eq('fecha', fecha)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, higiene: jsonArr<string>(data.higiene) } as Sueno;
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useSuenoHistorial(limite = 30) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['sueno_historial', limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sueno')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(limite);
      if (error) throw error;
      return (data as Sueno[]).map((s) => ({ ...s, higiene: jsonArr<string>(s.higiene) }));
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useUpsertSueno() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: { fecha: string; hora_dormir: string | null; hora_despertar: string | null; calidad: number | null; higiene: string[] }) => {
      const { data: existing } = await supabase.from('sueno').select('id').eq('fecha', datos.fecha).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('sueno').update(datos).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sueno').insert(datos);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['sueno_dia', vars.fecha] });
      qc.invalidateQueries({ queryKey: ['sueno_historial'] });
      qc.invalidateQueries({ queryKey: ['semana_bienestar'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── NUTRICIÓN ──────────────────────────────────────────────────────────────

export function useNutricionDia(fecha: string) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['nutricion_dia', fecha],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutricion')
        .select('*')
        .eq('fecha', fecha)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        etiquetas: jsonArr<string>(data.etiquetas),
        suplementos_tomados: jsonArr<string>(data.suplementos_tomados),
      } as Nutricion;
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useNutricionHistorial(limite = 30) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['nutricion_historial', limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutricion')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(limite);
      if (error) throw error;
      return (data as Nutricion[]).map((n) => ({
        ...n,
        etiquetas: jsonArr<string>(n.etiquetas),
        suplementos_tomados: jsonArr<string>(n.suplementos_tomados),
      }));
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useUpsertNutricion() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: { fecha: string; registro: string; etiquetas: string[]; suplementos_tomados: string[] }) => {
      const { data: existing } = await supabase.from('nutricion').select('id').eq('fecha', datos.fecha).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('nutricion').update(datos).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nutricion').insert(datos);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['nutricion_dia', vars.fecha] });
      qc.invalidateQueries({ queryKey: ['nutricion_historial'] });
      qc.invalidateQueries({ queryKey: ['semana_bienestar'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── SUPLEMENTOS ────────────────────────────────────────────────────────────

export function useSuplementos() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['suplementos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suplementos')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data as Suplemento[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearSuplemento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Suplemento, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('suplementos').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suplementos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarSuplemento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Suplemento> & { id: string }) => {
      const { error } = await supabase.from('suplementos').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suplementos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarSuplemento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suplementos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suplementos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── SUSTANCIAS ─────────────────────────────────────────────────────────────

export function useSustancias(mes: number, anio: number) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['sustancias', mes, anio],
    queryFn: async () => {
      const desde = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const fin = new Date(anio, mes, 0);
      const hasta = aISO(fin);
      const { data, error } = await supabase
        .from('sustancias')
        .select('*')
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data as Sustancia[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearSustancia() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Sustancia, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('sustancias').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sustancias'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarSustancia() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sustancias').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sustancias'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── SEMANA BIENESTAR ───────────────────────────────────────────────────────

export function useSemanaBienestar(lunesISO: string) {
  const aviso = useAviso();
  const lunes = deFechaISO(lunesISO);
  const hasta = aISO(new Date(lunes.getTime() + 6 * 24 * 60 * 60 * 1000));

  const result = useQuery({
    queryKey: ['semana_bienestar', lunesISO],
    queryFn: async (): Promise<SemanaBienestar> => {
      const [
        { data: entrenos, error: e1 },
        { data: animoDatos, error: e2 },
        { data: suenoDatos, error: e3 },
        { data: nutDatos, error: e4 },
      ] = await Promise.all([
        supabase.from('entrenamientos').select('*').gte('fecha', lunesISO).lte('fecha', hasta),
        supabase.from('animo').select('*').gte('fecha', lunesISO).lte('fecha', hasta),
        supabase.from('sueno').select('*').gte('fecha', lunesISO).lte('fecha', hasta),
        supabase.from('nutricion').select('*').gte('fecha', lunesISO).lte('fecha', hasta),
      ]);
      if (e1) throw e1; if (e2) throw e2; if (e3) throw e3; if (e4) throw e4;

      const entrenamientos = (entrenos ?? []) as Entrenamiento[];
      const minutosTotales = entrenamientos.reduce((s, e) => s + e.duracion_min, 0);

      const minutosPorActividad: Record<string, number> = {};
      for (const e of entrenamientos) {
        minutosPorActividad[e.actividad] = (minutosPorActividad[e.actividad] ?? 0) + e.duracion_min;
      }

      const intensidadMedia = entrenamientos.length > 0
        ? Math.round((entrenamientos.reduce((s, e) => s + e.intensidad, 0) / entrenamientos.length) * 10) / 10
        : 0;

      const lugaresUsados = [...new Set(
        entrenamientos.filter((e) => e.lugar).map((e) => e.lugar as string),
      )];

      const suenoArr = (suenoDatos ?? []) as Sueno[];
      const diasConSueno = suenoArr.length;
      const diasConAnimo = (animoDatos ?? []).length;
      const diasConNutricion = (nutDatos ?? []).length;

      const conCalidad = suenoArr.filter((s) => s.calidad != null);
      const promedioCalidadSueno = conCalidad.length > 0
        ? Math.round((conCalidad.reduce((s, r) => s + (r.calidad ?? 0), 0) / conCalidad.length) * 10) / 10
        : null;

      const animoArr = (animoDatos ?? []) as Animo[];
      const promedioAnimo = animoArr.length > 0
        ? Math.round((animoArr.reduce((s, a) => s + a.nivel, 0) / animoArr.length) * 10) / 10
        : null;

      return {
        minutosTotales,
        minutosPorActividad,
        intensidadMedia,
        lugaresUsados,
        diasConSueno,
        diasConAnimo,
        diasConNutricion,
        promedioCalidadSueno,
        promedioAnimo,
        entrenamientos,
      };
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}
