import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

/**
 * Vitest corre SOLO la capa de dominio (`src/core`): TypeScript puro, sin
 * dependencias de React/Expo/red. Por eso no necesita el entorno de RN.
 */
export default defineConfig({
  test: {
    include: ['src/core/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@data': resolve(__dirname, 'src/data'),
      '@services': resolve(__dirname, 'src/services'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@features': resolve(__dirname, 'src/features'),
    },
  },
  // El tsconfig.json del proyecto extiende `expo/tsconfig.base` (aún no
  // instalado en la fase de dominio). Damos a esbuild un tsconfig vacío para
  // que no intente resolver ese `extends`; los alias los maneja resolve.alias.
  esbuild: {
    tsconfigRaw: '{}',
  },
});
