import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography, type TypographyVariant } from '@shared/ui/theme';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
}

/** Texto base con tipografía Inter del tema. */
export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  center,
  style,
  ...rest
}: AppTextProps) {
  const base: TextStyle = { ...typography[variant], color };
  if (center) base.textAlign = 'center';
  return <Text style={[base, style]} {...rest} />;
}
