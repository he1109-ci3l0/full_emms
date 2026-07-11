export interface Entrenamiento {
  id: string;
  user_id: string;
  fecha: string;
  actividad: string;
  duracion_min: number;
  lugar: string | null;
  intensidad: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Nutricion {
  id: string;
  user_id: string;
  fecha: string;
  registro: string;
  etiquetas: string[];
  suplementos_tomados: string[];
  created_at: string;
  updated_at: string;
}

export interface Suplemento {
  id: string;
  user_id: string;
  nombre: string;
  dosis: string | null;
  existencias: number | null;
  recompra_fecha: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Animo {
  id: string;
  user_id: string;
  fecha: string;
  nivel: number;
  texto: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sueno {
  id: string;
  user_id: string;
  fecha: string;
  hora_dormir: string | null;
  hora_despertar: string | null;
  calidad: number | null;
  higiene: string[];
  created_at: string;
  updated_at: string;
}

export interface Sustancia {
  id: string;
  user_id: string;
  fecha: string;
  sustancia: string;
  cantidad: string | null;
  contexto_consumo: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface SemanaBienestar {
  minutosTotales: number;
  minutosPorActividad: Record<string, number>;
  intensidadMedia: number;
  lugaresUsados: string[];
  diasConSueno: number;
  diasConAnimo: number;
  diasConNutricion: number;
  promedioCalidadSueno: number | null;
  promedioAnimo: number | null;
  entrenamientos: Entrenamiento[];
}

export function calcularDuracionSueno(hora_dormir: string | null, hora_despertar: string | null): number | null {
  if (!hora_dormir || !hora_despertar) return null;
  const [dh, dm] = hora_dormir.split(':').map(Number);
  const [wh, wm] = hora_despertar.split(':').map(Number);
  let diff = (wh * 60 + wm) - (dh * 60 + dm);
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

export function formatDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}
