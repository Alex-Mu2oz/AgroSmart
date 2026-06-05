import type { ViewStyle } from 'react-native';

/**
 * Sombras sutiles para dar profundidad (elevación en Android, shadow* en iOS).
 * Se usan con moderación para mantener un aspecto sobrio y elegante.
 */
export const shadows = {
  none: {} as ViewStyle,
  sm: {
    shadowColor: '#1C2B24',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: '#1C2B24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  } as ViewStyle,
} as const;
