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
    },
  },
  // El tsconfig.json del proyecto extiende `expo/tsconfig.base` (aún no
  // instalado en la fase de dominio). Damos a esbuild un tsconfig vacío para
  // que no intente resolver ese `extends`; los alias los maneja resolve.alias.
  esbuild: {
    tsconfigRaw: '{}',
  },
});
