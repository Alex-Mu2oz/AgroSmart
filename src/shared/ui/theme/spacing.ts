/** Escala de espaciado 4/8 y radios. Touch targets mínimos 48 dp. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const sizes = {
  touchMin: 48, // accesibilidad: target táctil mínimo
  iconSm: 18,
  iconMd: 24,
  iconLg: 32,
} as const;
