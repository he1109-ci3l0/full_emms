export interface Conversacion {
  id: string;
  user_id: string;
  asunto: string;
  ultima_actividad: string;
  created_at: string;
}

export interface Mensaje {
  id: string;
  user_id: string;
  conversacion_id: string;
  rol: 'usuaria' | 'agente';
  texto: string;
  created_at: string;
}

export interface AccionAgente {
  id: string;
  user_id: string;
  conversacion_id: string;
  tipo_accion: string;
  tabla_destino: string;
  payload: Record<string, unknown>;
  estado: 'propuesta' | 'aplicada' | 'rechazada';
  registro_id: string | null;
  created_at: string;
}

export interface Propuesta {
  id: string;
  tipo_accion: string;
  descripcion: string;
}

export interface RespuestaSecretaria {
  texto: string;
  propuestas: Propuesta[];
}

export interface MensajeUI extends Mensaje {
  propuestas?: Propuesta[];
}
