import type { ExpoConfig } from 'expo/config';

/**
 * Configuración de AgroSmart.
 * - Marca: verde #1B6B3A (manual de marca + logotipo).
 * - Requiere development build (react-native-maps no corre en Expo Go).
 * - Sin secretos en el bundle: Open-Meteo y RainViewer no usan API key.
 */
const config: ExpoConfig = {
  name: 'AgroSmart',
  slug: 'agrosmart',
  owner: 'alex-mu2oz',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'agrosmart',
  platforms: ['android', 'ios', 'web'],
  userInterfaceStyle: 'light',
  icon: './assets/images/icon.png',
  extra: {
    eas: {
      projectId: '4a8258ee-7642-4cd5-830c-d73f8912ef98',
    },
  },
  assetBundlePatterns: ['**/*'],
  android: {
    package: 'com.agrosmart.app',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.agrosmart.app',
  },
  // Sin target web en el piloto: la app es Android. (Evita el bundling web de
  // expo-sqlite, que requiere assets wasm que no usamos.)
  plugins: ['expo-router', 'expo-sqlite', 'expo-font'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
