import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAviso } from '../../components/Aviso';
import type {
  Ciclo,
  Medico,
  Medicamento,
  PresupuestoMedico,
  Procedimiento,
  Toma,
} from '../../types/salud';

// ── CICLO ──────────────────────────────────────────────────────────────────

export function useCiclo() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['ciclo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ciclo')
        .select('*')
        .order('fecha_inicio', { ascending: false });
      if (error) throw error;
      return (data as Ciclo[]).map((c) => ({
        ...c,
        sintomas: Array.isArray(c.sintomas) ? c.sintomas : [],
      }));
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearCiclo() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Ciclo, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('ciclo').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ciclo'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarCiclo() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Ciclo> & { id: string }) => {
      const { error } = await supabase.from('ciclo').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ciclo'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarCiclo() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ciclo').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ciclo'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── MEDICAMENTOS ───────────────────────────────────────────────────────────

export function useMedicamentos() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['medicamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return (data as Medicamento[]).map((m) => ({
        ...m,
        horarios: Array.isArray(m.horarios) ? m.horarios : [],
      }));
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearMedicamento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Medicamento, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('medicamentos').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicamentos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarMedicamento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Medicamento> & { id: string }) => {
      const { error } = await supabase.from('medicamentos').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicamentos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarMedicamento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medicamentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medicamentos'] });
      qc.invalidateQueries({ queryKey: ['tomas'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── TOMAS ──────────────────────────────────────────────────────────────────

export function useTomas(fecha: string) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['tomas', fecha],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tomas')
        .select('*')
        .eq('fecha', fecha)
        .order('horario');
      if (error) throw error;
      return data as Toma[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useTomas7Dias(medicamentoId: string) {
  const aviso = useAviso();
  const hoy = new Date();
  const hace7 = new Date(hoy.getTime() - 6 * 24 * 60 * 60 * 1000);
  const desde = `${hace7.getFullYear()}-${String(hace7.getMonth() + 1).padStart(2, '0')}-${String(hace7.getDate()).padStart(2, '0')}`;
  const hasta = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const result = useQuery({
    queryKey: ['tomas7', medicamentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tomas')
        .select('*')
        .eq('medicamento_id', medicamentoId)
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha');
      if (error) throw error;
      return data as Toma[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useRegistrarToma() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Toma, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('tomas').insert(datos);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['tomas', vars.fecha] });
      qc.invalidateQueries({ queryKey: ['tomas7', vars.medicamento_id] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarToma() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fecha, medicamento_id }: { id: string; fecha: string; medicamento_id: string }) => {
      const { error } = await supabase.from('tomas').delete().eq('id', id);
      if (error) throw error;
      return { fecha, medicamento_id };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['tomas', vars.fecha] });
      qc.invalidateQueries({ queryKey: ['tomas7', vars.medicamento_id] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── MÉDICOS ────────────────────────────────────────────────────────────────

export function useMedicos() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['medicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicos')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data as Medico[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearMedico() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Medico, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('medicos').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarMedico() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Medico> & { id: string }) => {
      const { error } = await supabase.from('medicos').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarMedico() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medicos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medicos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── PROCEDIMIENTOS ─────────────────────────────────────────────────────────

export function useProcedimientos() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['procedimientos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedimientos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Procedimiento[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearProcedimiento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Procedimiento, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('procedimientos').insert(datos).select().single();
      if (error) throw error;
      return data as Procedimiento;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procedimientos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarProcedimiento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Procedimiento> & { id: string }) => {
      const { error } = await supabase.from('procedimientos').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procedimientos'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarProcedimiento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('procedimientos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['procedimientos'] });
      qc.invalidateQueries({ queryKey: ['presupuestos'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── PRESUPUESTOS MÉDICOS ───────────────────────────────────────────────────

export function usePresupuestos(procedimientoId: string) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['presupuestos', procedimientoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presupuestos_medicos')
        .select('*')
        .eq('procedimiento_id', procedimientoId)
        .order('created_at');
      if (error) throw error;
      return (data as PresupuestoMedico[]).map((p) => ({
        ...p,
        incluye: Array.isArray(p.incluye) ? p.incluye : [],
      }));
    },
    enabled: !!procedimientoId,
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearPresupuesto() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<PresupuestoMedico, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('presupuestos_medicos').insert(datos);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['presupuestos', vars.procedimiento_id] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarPresupuesto() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, procedimiento_id }: { id: string; procedimiento_id: string }) => {
      const { error } = await supabase.from('presupuestos_medicos').delete().eq('id', id);
      if (error) throw error;
      return { procedimiento_id };
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['presupuestos', vars.procedimiento_id] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}
