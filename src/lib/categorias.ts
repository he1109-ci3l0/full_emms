export const CATEGORIAS = [
  'renta',
  'súper',
  'transporte',
  'salud',
  'estética',
  'entreno',
  'suscripciones',
  'software',
  'hogar',
  'general',
] as const;

export type CategoriaBase = typeof CATEGORIAS[number];
