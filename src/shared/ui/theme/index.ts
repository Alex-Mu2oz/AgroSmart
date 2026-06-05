import { colors, semaforoColores, semaforoLabel } from '@shared/ui/theme/colors';
import { radius, sizes, spacing } from '@shared/ui/theme/spacing';
import { fontFamily, typography } from '@shared/ui/theme/typography';

/**
 * Tema central de AgroSmart. Solo modo claro en el piloto, así que un objeto
 * estático basta (sin Context de tema). `useTheme` se mantiene como hook por
 * conveniencia y para facilitar un futuro modo oscuro.
 */
export const theme = {
  colors,
  semaforoColores,
  semaforoLabel,
  spacing,
  radius,
  sizes,
  typography,
  fontFamily,
} as const;

export type Theme = typeof theme;

export function useTheme(): Theme {
  return theme;
}

export { colors, semaforoColores, semaforoLabel } from '@shared/ui/theme/colors';
export { spacing, radius, sizes } from '@shared/ui/theme/spacing';
export { typography, fontFamily } from '@shared/ui/theme/typography';
export type { TypographyVariant } from '@shared/ui/theme/typography';
