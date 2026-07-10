export type ContextoClave =
  | 'portafolio'
  | 'antioquia'
  | 'cipreses'
  | 'consultoria'
  | 'legal'
  | 'bootcamp'
  | 'personal';

export type EstadoProyecto = 'activo' | 'pausado' | 'completado';
export type Prioridad = 'alta' | 'media' | 'baja';
export type TipoEvento = 'cita' | 'entrevista' | 'consulta' | 'entreno' | 'otro';

export type Proyecto = {
  id: string;
  user_id: string;
  nombre: string;
  contexto: ContextoClave;
  estado: EstadoProyecto;
  nota: string | null;
  created_at: string;
  updated_at: string;
};

export type Pendiente = {
  id: string;
  user_id: string;
  titulo: string;
  contexto: ContextoClave;
  prioridad: Prioridad;
  fecha_limite: string | null;
  hecho: boolean;
  proyecto_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Evento = {
  id: string;
  user_id: string;
  titulo: string;
  fecha: string;
  hora: string | null;
  duracion_min: number | null;
  contexto: ContextoClave;
  lugar: string | null;
  tipo: TipoEvento;
  vinculo_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Nota = {
  id: string;
  user_id: string;
  texto: string;
  contexto: ContextoClave;
  created_at: string;
  updated_at: string;
};
