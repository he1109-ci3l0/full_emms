export const HIGIENE_SUENO = [
  'sin pantallas 1h antes',
  'sin cafeína después de las 16h',
  'horario regular',
  'cuarto oscuro',
  'cuarto fresco',
  'sin alcohol',
  'cena ligera',
] as const;

export type ItemHigieneSueno = typeof HIGIENE_SUENO[number];

const HIGIENE_LEN = HIGIENE_SUENO.length as number;

export function pctHigiene(items: string[]): number {
  if (HIGIENE_LEN === 0) return 0;
  const cumplidos = items.filter((i) => (HIGIENE_SUENO as readonly string[]).includes(i)).length;
  return Math.round((cumplidos / HIGIENE_LEN) * 100);
}
