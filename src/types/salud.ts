export type TipoProcedimiento = 'cirugia' | 'estetica' | 'laser' | 'podologia' | 'dental' | 'estudio' | 'otro';
export type EstadoProcedimiento = 'explorando' | 'cotizado' | 'agendado' | 'realizado' | 'descartado';

export interface Ciclo {
  id: string;
  user_id: string;
  fecha_inicio: string;
  duracion_dias: number | null;
  sintomas: string[];
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Medicamento {
  id: string;
  user_id: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  horarios: string[];
  activo: boolean;
  motivo: string | null;
  created_at: string;
  updated_at: string;
}

export interface Toma {
  id: string;
  user_id: string;
  medicamento_id: string;
  fecha: string;
  horario: string;
  tomada: boolean;
  created_at: string;
  updated_at: string;
}

export interface Medico {
  id: string;
  user_id: string;
  nombre: string;
  especialidad: string;
  telefono: string | null;
  consultorio: string | null;
  tarifa_consulta: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Procedimiento {
  id: string;
  user_id: string;
  nombre: string;
  tipo: TipoProcedimiento;
  medico_id: string | null;
  fecha_tentativa: string | null;
  estado: EstadoProcedimiento;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface PresupuestoMedico {
  id: string;
  user_id: string;
  procedimiento_id: string;
  concepto: string;
  monto: number;
  incluye: string[];
  vigencia: string | null;
  created_at: string;
  updated_at: string;
}

export type PrediccionCiclo = {
  proximaFecha: string;
  diasRestantes: number;
  promedioIntervalo: number;
  promedioDuracion: number | null;
} | null;
