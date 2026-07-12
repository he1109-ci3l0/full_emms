export interface Alerta {
  id: string;
  user_id: string;
  origen_tabla: string;
  origen_id: string | null;
  mensaje: string;
  dispara_en: string;
  enviada: boolean;
  created_at: string;
}

export interface Dispositivo {
  id: string;
  user_id: string;
  plataforma: 'android' | 'ios_pwa' | 'web';
  token: string;
  activo: boolean;
  created_at: string;
}

export interface SilencioConfig {
  inicio: string;
  fin: string;
}
