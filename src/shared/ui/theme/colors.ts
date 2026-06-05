import type { Semaforo } from '@core/models';

/**
 * Paleta basada en el MANUAL DE MARCA de AgroSmart.
 * El semáforo nunca depende solo del color: se acompaña de ícono + forma +
 * palabra (ver SemaphoreBadge). El amarillo de marca solo contrasta con texto
 * oscuro, por eso "PRECAUCIÓN" va en texto #1C1C1C sobre el amarillo.
 */
export const brand = {
  primary: '#1B6B3A', // verde de marca (CTA, navegación activa)
  secondary: '#E6E0D3', // beige (superficies/realces)
  tertiary: '#FAD002', // amarillo (acento)
  neutral: '#4A4A4A',
} as const;

export const colors = {
  brand,

  // Fondos / superficies (derivados sobrios de la marca)
  bg: '#F5F5F3',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEDE7',
  border: '#E2E2DE',

  // Texto
  textPrimary: '#1C1C1C',
  textSecondary: '#4A4A4A',
  textInverse: '#FFFFFF',
  textOnBrand: '#FFFFFF',

  // Tinta oscura para botón "Inverted" del manual
  inkDark: '#1F2A24',

  // Estados / acentos
  focus: '#1B6B3A',
  danger: '#C62828',
  disabledBg: '#D9D9D4',
  disabledText: '#8A8A85',
} as const;

/** Color de fondo, texto y borde por estado de semáforo. */
export interface SemaforoColores {
  fill: string;
  text: string;
  border: string;
}

export const semaforoColores: Record<Semaforo, SemaforoColores> = {
  verde: { fill: '#1B6B3A', text: '#FFFFFF', border: '#155A30' },
  amarillo: { fill: '#FAD002', text: '#1C1C1C', border: '#D9B400' },
  rojo: { fill: '#C62828', text: '#FFFFFF', border: '#A71D1D' },
};

/** Etiqueta textual del semáforo (redundancia para accesibilidad). */
export const semaforoLabel: Record<Semaforo, string> = {
  verde: 'SEGURO',
  amarillo: 'PRECAUCIÓN',
  rojo: 'ALTO',
};
