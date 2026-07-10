const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_ABR = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MESES_ABR = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function aISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function deFechaISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function esHoy(iso: string): boolean {
  return iso === aISO(new Date());
}

export function lunesDe(fecha: Date): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d;
}

export function rangoSemana(fecha: Date): { inicio: Date; fin: Date } {
  const inicio = lunesDe(fecha);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  return { inicio, fin };
}

export function rangoMes(fecha: Date): { inicio: Date; fin: Date } {
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
  return { inicio, fin };
}

export function diasDelGrid(fecha: Date): Date[] {
  const { inicio, fin } = rangoMes(fecha);
  const cursor = lunesDe(inicio);
  const dias: Date[] = [];
  while (cursor <= fin || dias.length % 7 !== 0) {
    dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    if (dias.length >= 42) break;
  }
  return dias;
}

export function diasDeSemana(fecha: Date): Date[] {
  const { inicio } = rangoSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
}

// ── Formateadores ──────────────────────────────────────────────────────────

export function formatDiaCorto(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES_ABR[m - 1]}`;
}

export function formatDiaCompleto(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return `${DIAS[fecha.getDay()]} ${d} de ${MESES[m - 1]} ${y}`;
}

export function formatMesAnio(fecha: Date): string {
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

export function formatRangoSemana(fecha: Date): string {
  const { inicio, fin } = rangoSemana(fecha);
  const mesI = inicio.getMonth();
  const mesF = fin.getMonth();
  if (mesI === mesF) {
    return `${inicio.getDate()}–${fin.getDate()} ${MESES_ABR[mesI]} ${fin.getFullYear()}`;
  }
  return `${inicio.getDate()} ${MESES_ABR[mesI]}–${fin.getDate()} ${MESES_ABR[mesF]} ${fin.getFullYear()}`;
}

export function nombreDiaAbr(fecha: Date): string {
  return DIAS_ABR[fecha.getDay()];
}

export function sumarDias(fecha: Date, n: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + n);
  return d;
}

export function sumarMeses(fecha: Date, n: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + n, 1);
}
