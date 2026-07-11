export type TipoContrato = 'consultoria' | 'nomina' | 'proyecto' | 'iguala';
export type EstadoContrato = 'prospecto' | 'activo' | 'terminado';
export type PeriodicidadTarifa = 'hora' | 'proyecto' | 'mensual';

export interface Contrato {
  id: string;
  user_id: string;
  cliente: string;
  rol: string;
  tipo: TipoContrato;
  inicio: string;
  fin: string | null;
  tarifa: number | null;
  periodicidad_tarifa: PeriodicidadTarifa | null;
  estado: EstadoContrato;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type MedioEntrevista = 'presencial' | 'videollamada' | 'telefonica';
export type EtapaEntrevista = 'screening' | 'primera' | 'tecnica' | 'final' | 'oferta';
export type ResultadoEntrevista = 'pendiente' | 'avanzo' | 'rechazada' | 'oferta_recibida' | 'declinada';

export interface Entrevista {
  id: string;
  user_id: string;
  empresa: string;
  puesto: string;
  fecha: string;
  hora: string | null;
  medio: MedioEntrevista;
  etapa: EtapaEntrevista;
  resultado: ResultadoEntrevista | null;
  evento_id: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export const ETAPAS: EtapaEntrevista[] = ['screening', 'primera', 'tecnica', 'final', 'oferta'];

export function siguienteEtapa(etapa: EtapaEntrevista): EtapaEntrevista | null {
  const idx = ETAPAS.indexOf(etapa);
  return idx >= 0 && idx < ETAPAS.length - 1 ? ETAPAS[idx + 1] : null;
}
