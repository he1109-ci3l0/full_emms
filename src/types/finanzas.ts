export type TipoCuenta = 'efectivo' | 'debito' | 'credito' | 'inversion' | 'ahorro';
export type TipoMovimiento = 'ingreso' | 'gasto' | 'transferencia';
export type EstadoCobranza = 'pendiente' | 'parcial' | 'pagado' | 'vencido';
export type RecurrenciaPago = 'mensual' | 'quincenal' | 'anual';
export type EstadoPago = 'pendiente' | 'pagado';
export type EtiquetaMeta = 'general' | 'medica' | 'viaje' | 'equipo' | 'colchon';

export interface Cuenta {
  id: string;
  user_id: string;
  nombre: string;
  tipo: TipoCuenta;
  saldo_inicial: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface CuentaConSaldo extends Cuenta {
  saldo: number;
}

export interface Movimiento {
  id: string;
  user_id: string;
  cuenta_id: string;
  tipo: TipoMovimiento;
  monto: number;
  categoria: string;
  fecha: string;
  concepto: string | null;
  contexto: string;
  cuenta_destino_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cobranza {
  id: string;
  user_id: string;
  deudor: string;
  concepto: string;
  monto: number;
  monto_pagado: number;
  fecha_limite: string | null;
  estado: EstadoCobranza;
  contexto: string;
  created_at: string;
  updated_at: string;
}

export interface PagoProgramado {
  id: string;
  user_id: string;
  acreedor: string;
  concepto: string;
  monto: number;
  fecha_limite: string;
  recurrencia: RecurrenciaPago | null;
  estado: EstadoPago;
  created_at: string;
  updated_at: string;
}

export interface Meta {
  id: string;
  user_id: string;
  nombre: string;
  etiqueta: EtiquetaMeta;
  monto_objetivo: number;
  monto_actual: number;
  fecha_objetivo: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deuda {
  id: string;
  user_id: string;
  acreedor: string;
  monto_original: number;
  saldo: number;
  tasa_anual: number | null;
  pago_minimo: number | null;
  fecha_corte: number | null;
  created_at: string;
  updated_at: string;
}

export interface Inversion {
  id: string;
  user_id: string;
  instrumento: string;
  monto: number;
  fecha_entrada: string;
  rendimiento_esperado: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface HistorialCrediticio {
  id: string;
  user_id: string;
  fecha_consulta: string;
  buro: string;
  score: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}
