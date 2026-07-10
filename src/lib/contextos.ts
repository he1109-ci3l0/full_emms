import { SUCULENTAS, HOJAS, LAVANDA } from '../theme/colores';
import type { ContextoClave } from '../types/nucleo';

type ContextoItem = {
  clave: ContextoClave;
  color: string;
  etiqueta: string;
};

export const CONTEXTOS: Record<ContextoClave, ContextoItem> = {
  portafolio:  { clave: 'portafolio',  color: SUCULENTAS.malva,       etiqueta: 'Portafolio' },
  antioquia:   { clave: 'antioquia',   color: SUCULENTAS.pizarra,     etiqueta: 'Antioquia 43' },
  cipreses:    { clave: 'cipreses',    color: HOJAS.salvia,           etiqueta: 'Cipreses' },
  consultoria: { clave: 'consultoria', color: LAVANDA.aqua,           etiqueta: 'Consultoría' },
  legal:       { clave: 'legal',       color: HOJAS.ciruela,          etiqueta: 'Legal / PROFECO' },
  bootcamp:    { clave: 'bootcamp',    color: HOJAS.caramelo,         etiqueta: 'Bootcamp' },
  personal:    { clave: 'personal',    color: LAVANDA.rosaLavanda,    etiqueta: 'Personal' },
};

export const CONTEXTOS_LISTA: ContextoItem[] = Object.values(CONTEXTOS);
