import type { TextStyle } from 'react-native';

/**
 * Tipografía Inter (manual de marca). Escala grande para uso en campo
 * (sol, gama baja). Pesos 400/600/700. Las familias se cargan con
 * @expo-google-fonts/inter en el arranque (ver useFonts en el root layout).
 */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 36 },
  title: { fontFamily: fontFamily.semibold, fontSize: 22, lineHeight: 30 },
  subtitle: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: fontFamily.regular, fontSize: 17, lineHeight: 24 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 24 },
  label: { fontFamily: fontFamily.medium, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
