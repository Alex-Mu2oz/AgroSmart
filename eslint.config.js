// Flat config de ESLint para AgroSmart.
// Lo esencial: blindar la REGLA DE DEPENDENCIAS de la arquitectura limpia.
// `src/core` (dominio puro) no puede importar de react, expo, ni de las capas
// externas (services/data/stores/shared/features). Si alguien lo intenta, falla el lint.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'contexto_agrosmart/*'],
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-native',
                'expo',
                'expo-*',
                '@expo/*',
                '@services/*',
                '@data/*',
                '@stores/*',
                '@shared/*',
                '@features/*',
              ],
              message:
                'La capa de dominio (src/core) debe ser TypeScript puro: no puede importar de UI, Expo ni de las capas externas. Recibe tiempo/ids/datos como parámetros.',
            },
          ],
        },
      ],
    },
  },
];
