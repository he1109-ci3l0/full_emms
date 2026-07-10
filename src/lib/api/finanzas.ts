import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAviso } from '../../components/Aviso';
import { aISO } from '../fechas';
import type {
  Cuenta,
  CuentaConSaldo,
  Cobranza,
  Deuda,
  EstadoCobranza,
  HistorialCrediticio,
  Inversion,
  Meta,
  Movimiento,
  PagoProgramado,
  RecurrenciaPago,
} from '../../types/finanzas';

// ── Helpers internos ───────────────────────────────────────────────────────

function calcularSaldo(cuenta: Cuenta, movimientos: Movimiento[]): number {
  let saldo = Number(cuenta.saldo_inicial);
  for (const m of movimientos) {
    const monto = Number(m.monto);
    if (m.cuenta_id === cuenta.id) {
      if (m.tipo === 'ingreso') saldo += monto;
      else if (m.tipo === 'gasto') saldo -= monto;
      else if (m.tipo === 'transferencia') saldo -= monto;
    }
    if (m.cuenta_destino_id === cuenta.id && m.tipo === 'transferencia') {
      saldo += monto;
    }
  }
  return saldo;
}

function estadoCobranza(monto: number, monto_pagado: number, fecha_limite: string | null, hoy: string): EstadoCobranza {
  const pagado = Number(monto_pagado);
  const total = Number(monto);
  if (pagado >= total) return 'pagado';
  if (pagado > 0) return 'parcial';
  if (fecha_limite && fecha_limite < hoy) return 'vencido';
  return 'pendiente';
}

function nextFechaLimite(fechaISO: string, recurrencia: RecurrenciaPago): string {
  const [y, m, d] = fechaISO.split('-').map(Number);
  if (recurrencia === 'mensual') return aISO(new Date(y, m, d));
  if (recurrencia === 'quincenal') return aISO(new Date(y, m - 1, d + 15));
  return aISO(new Date(y + 1, m - 1, d));
}

export type FiltroMovimientos = {
  mes: number;
  anio: number;
  tipo?: string;
  categoria?: string;
  contexto?: string;
};

// ── CUENTAS ────────────────────────────────────────────────────────────────

export function useCuentas() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['cuentas'],
    queryFn: async (): Promise<CuentaConSaldo[]> => {
      const [{ data: cuentas, error: ec }, { data: movs, error: em }] = await Promise.all([
        supabase.from('cuentas').select('*').eq('activa', true).order('nombre'),
        supabase.from('movimientos').select('*'),
      ]);
      if (ec) throw ec;
      if (em) throw em;
      const movimientos = (movs ?? []) as Movimiento[];
      return (cuentas as Cuenta[]).map((c) => ({
        ...c,
        saldo: calcularSaldo(c, movimientos),
      }));
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearCuenta() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Cuenta, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('cuentas').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarCuenta() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Cuenta> & { id: string }) => {
      const { error } = await supabase.from('cuentas').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarCuenta() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cuentas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cuentas'] });
      qc.invalidateQueries({ queryKey: ['movimientos'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── MOVIMIENTOS ────────────────────────────────────────────────────────────

export function useMovimientos(filtros: FiltroMovimientos) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['movimientos', filtros],
    queryFn: async () => {
      const desde = `${filtros.anio}-${String(filtros.mes).padStart(2, '0')}-01`;
      const fin = new Date(filtros.anio, filtros.mes, 0);
      const hasta = aISO(fin);
      let q = supabase
        .from('movimientos')
        .select('*')
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha', { ascending: false });
      if (filtros.tipo) q = q.eq('tipo', filtros.tipo);
      if (filtros.categoria) q = q.eq('categoria', filtros.categoria);
      if (filtros.contexto) q = q.eq('contexto', filtros.contexto);
      const { data, error } = await q;
      if (error) throw error;
      return data as Movimiento[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearMovimiento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Movimiento, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('movimientos').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimientos'] });
      qc.invalidateQueries({ queryKey: ['cuentas'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarMovimiento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Movimiento> & { id: string }) => {
      const { error } = await supabase.from('movimientos').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimientos'] });
      qc.invalidateQueries({ queryKey: ['cuentas'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarMovimiento() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('movimientos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimientos'] });
      qc.invalidateQueries({ queryKey: ['cuentas'] });
    },
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── COBRANZAS ──────────────────────────────────────────────────────────────

export function useCobranzas(filtroEstado?: EstadoCobranza) {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['cobranzas', filtroEstado],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cobranzas')
        .select('*')
        .order('fecha_limite', { ascending: true, nullsFirst: false });
      if (error) throw error;
      const hoy = aISO(new Date());
      const lista = (data as Cobranza[]).map((c) => ({
        ...c,
        estado: estadoCobranza(c.monto, c.monto_pagado, c.fecha_limite, hoy),
      }));
      if (filtroEstado) return lista.filter((c) => c.estado === filtroEstado);
      return lista;
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearCobranza() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Cobranza, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('cobranzas').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cobranzas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useRegistrarPagoCobranza() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, monto_pagado, monto }: { id: string; monto_pagado: number; monto: number }) => {
      const hoy = aISO(new Date());
      const nuevoEstado: EstadoCobranza =
        monto_pagado >= monto ? 'pagado' : monto_pagado > 0 ? 'parcial' : 'pendiente';
      const { error } = await supabase
        .from('cobranzas')
        .update({ monto_pagado, estado: nuevoEstado })
        .eq('id', id);
      if (error) throw error;
      void hoy;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cobranzas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarCobranza() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cobranzas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cobranzas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── PAGOS PROGRAMADOS ──────────────────────────────────────────────────────

export function usePagosProgramados() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['pagos_programados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos_programados')
        .select('*')
        .order('fecha_limite', { ascending: true });
      if (error) throw error;
      return data as PagoProgramado[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearPago() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<PagoProgramado, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('pagos_programados').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pagos_programados'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useMarcarPagado() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pago: PagoProgramado) => {
      const { error } = await supabase
        .from('pagos_programados')
        .update({ estado: 'pagado' })
        .eq('id', pago.id);
      if (error) throw error;
      if (pago.recurrencia) {
        const siguiente = {
          acreedor: pago.acreedor,
          concepto: pago.concepto,
          monto: pago.monto,
          fecha_limite: nextFechaLimite(pago.fecha_limite, pago.recurrencia),
          recurrencia: pago.recurrencia,
          estado: 'pendiente' as const,
        };
        const { error: e2 } = await supabase.from('pagos_programados').insert(siguiente);
        if (e2) throw e2;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pagos_programados'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarPago() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pagos_programados').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pagos_programados'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── METAS ──────────────────────────────────────────────────────────────────

export function useMetas() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['metas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Meta[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearMeta() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Meta, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('metas').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['metas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useAbonarMeta() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, monto_actual }: { id: string; monto_actual: number }) => {
      const { error } = await supabase.from('metas').update({ monto_actual }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['metas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarMeta() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['metas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── DEUDAS ─────────────────────────────────────────────────────────────────

export function useDeudas() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['deudas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deudas')
        .select('*')
        .order('saldo', { ascending: false });
      if (error) throw error;
      return data as Deuda[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearDeuda() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Deuda, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('deudas').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deudas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useEditarDeuda() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...datos }: Partial<Deuda> & { id: string }) => {
      const { error } = await supabase.from('deudas').update(datos).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deudas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarDeuda() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deudas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deudas'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── INVERSIONES ────────────────────────────────────────────────────────────

export function useInversiones() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['inversiones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inversiones')
        .select('*')
        .order('fecha_entrada', { ascending: false });
      if (error) throw error;
      return data as Inversion[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearInversion() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<Inversion, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('inversiones').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inversiones'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarInversion() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inversiones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inversiones'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

// ── HISTORIAL CREDITICIO ───────────────────────────────────────────────────

export function useHistorialCrediticio() {
  const aviso = useAviso();
  const result = useQuery({
    queryKey: ['historial_crediticio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historial_crediticio')
        .select('*')
        .order('fecha_consulta', { ascending: false });
      if (error) throw error;
      return data as HistorialCrediticio[];
    },
  });
  useEffect(() => {
    if (result.error) aviso.mostrar((result.error as Error).message);
  }, [result.error]);
  return result;
}

export function useCrearRegistroCrediticio() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: Omit<HistorialCrediticio, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('historial_crediticio').insert(datos);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['historial_crediticio'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}

export function useBorrarRegistroCrediticio() {
  const aviso = useAviso();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('historial_crediticio').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['historial_crediticio'] }),
    onError: (e) => aviso.mostrar(e.message),
  });
}
