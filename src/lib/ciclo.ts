import { aISO, deFechaISO } from './fechas';
import type { Ciclo, PrediccionCiclo } from '../types/salud';

export function predecirCiclo(registros: Ciclo[]): PrediccionCiclo {
  const ordenados = [...registros].sort(
    (a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio),
  );

  if (ordenados.length < 2) return null;

  const ultimos = ordenados.slice(-6);

  const intervalos: number[] = [];
  for (let i = 1; i < ultimos.length; i++) {
    const anterior = deFechaISO(ultimos[i - 1].fecha_inicio).getTime();
    const actual = deFechaISO(ultimos[i].fecha_inicio).getTime();
    intervalos.push(Math.round((actual - anterior) / (1000 * 60 * 60 * 24)));
  }

  const promedioIntervalo = Math.round(
    intervalos.reduce((s, v) => s + v, 0) / intervalos.length,
  );

  const duraciones = ultimos
    .filter((c) => c.duracion_dias != null)
    .map((c) => c.duracion_dias as number);
  const promedioDuracion =
    duraciones.length > 0
      ? Math.round(duraciones.reduce((s, v) => s + v, 0) / duraciones.length)
      : null;

  const ultimaFecha = deFechaISO(ordenados[ordenados.length - 1].fecha_inicio);
  const proximaMs = ultimaFecha.getTime() + promedioIntervalo * 24 * 60 * 60 * 1000;
  const proximaFecha = aISO(new Date(proximaMs));

  const hoyMs = new Date().setHours(0, 0, 0, 0);
  const diasRestantes = Math.round((proximaMs - hoyMs) / (1000 * 60 * 60 * 24));

  return { proximaFecha, diasRestantes, promedioIntervalo, promedioDuracion };
}
