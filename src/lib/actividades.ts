import { HOJAS, LAVANDA, SUCULENTAS } from '../theme/colores';

export type ActividadItem = { nombre: string; color: string };

export const ACTIVIDADES_BASE: ActividadItem[] = [
  { nombre: 'pesas',            color: SUCULENTAS.pizarra },
  { nombre: 'natación',         color: LAVANDA.aqua },
  { nombre: 'pilates',          color: LAVANDA.rosaLavanda },
  { nombre: 'barre',            color: SUCULENTAS.malva },
  { nombre: 'estiramientos',    color: HOJAS.salvia },
  { nombre: 'yoga',             color: LAVANDA.celeste },
  { nombre: 'sprints',          color: HOJAS.vino },
  { nombre: 'acondicionamiento',color: HOJAS.caramelo },
  { nombre: 'baile',            color: HOJAS.ciruela },
];

const COLORES_CICLO = [
  SUCULENTAS.pizarra, LAVANDA.aqua, LAVANDA.rosaLavanda, SUCULENTAS.malva,
  HOJAS.salvia, LAVANDA.celeste, HOJAS.vino, HOJAS.caramelo, HOJAS.ciruela,
  LAVANDA.arena, HOJAS.malvaGris, SUCULENTAS.salviaClara,
];

export function colorDeActividad(nombre: string): string {
  const base = ACTIVIDADES_BASE.find((a) => a.nombre === nombre);
  if (base) return base.color;
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = (hash * 31 + nombre.charCodeAt(i)) & 0xffff;
  return COLORES_CICLO[hash % COLORES_CICLO.length];
}
