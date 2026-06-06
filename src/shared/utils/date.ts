const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Formatea una fecha ISO a local: "DD MMM, HH:MM" (p. ej. "06 jun, 17:25") */
export function formatFechaCorta(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dia = pad(d.getDate());
  const mes = MESES[d.getMonth()] ?? '';
  const hora = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${dia} ${mes}, ${hora}:${min}`;
}

/** Formatea una fecha ISO a local: "DD MMM YYYY, HH:MM" (p. ej. "06 jun 2026, 17:25") */
export function formatFechaLarga(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dia = pad(d.getDate());
  const mes = MESES[d.getMonth()] ?? '';
  const anio = d.getFullYear();
  const hora = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${dia} ${mes} ${anio}, ${hora}:${min}`;
}

/** Formatea una fecha ISO a local completa: "DD/MM/YYYY, HH:MM:SS" (p. ej. "06/06/2026, 17:25:55") */
export function formatFechaCompleta(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dia = pad(d.getDate());
  const mes = pad(d.getMonth() + 1);
  const anio = d.getFullYear();
  const hora = pad(d.getHours());
  const min = pad(d.getMinutes());
  const seg = pad(d.getSeconds());
  return `${dia}/${mes}/${anio}, ${hora}:${min}:${seg}`;
}

/** Formatea una fecha ISO a local con día de semana: "sem, HH:MM" (p. ej. "sáb, 17:25") */
export function formatHoraConDia(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const sem = DIAS_SEMANA[d.getDay()] ?? '';
  const hora = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${sem}, ${hora}:${min}`;
}
