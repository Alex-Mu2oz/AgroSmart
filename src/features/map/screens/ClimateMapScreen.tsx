import type { ComponentType } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchRainViewerLayer } from '@services/rainviewer/indexService';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useNetworkStatus } from '@shared/hooks/useNetworkStatus';
import { AppText, BrandHeader, Card } from '@shared/ui/components';
import { colors, radius, spacing } from '@shared/ui/theme';

/**
 * Carga segura de react-native-webview. En un APK que aún no lo incluye (build
 * viejo), `require` lanza al buscar el módulo nativo `RNCWebViewModule`; lo
 * capturamos para NO romper el arranque de la app. En el build correcto,
 * `WebViewComp` es el componente real.
 */
let WebViewComp: ComponentType<{
  originWhitelist?: string[];
  source: { html: string };
  style?: unknown;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  startInLoadingState?: boolean;
}> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  WebViewComp = require('react-native-webview').WebView;
} catch {
  WebViewComp = null;
}

/**
 * Mapa climático SIN clave: Leaflet + OpenStreetMap (base) + radar de
 * precipitación de RainViewer (overlay), dentro de un WebView. Centrado en el
 * lote. No usa Google Maps ni API keys → respeta el requisito de no exponer
 * secretos. Es una VISTA CONTEXTUAL: no alimenta la decisión (eso sale del
 * paso "Ambiente" con Open-Meteo).
 */
function buildLeafletHtml(lat: number, lon: number, radarUrl: string | null): string {
  const radarLayer = radarUrl
    ? `L.tileLayer('${radarUrl}', { opacity: 0.6, maxNativeZoom: 7 }).addTo(map);`
    : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;padding:0;background:#F5F5F3}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map').setView([${lat}, ${lon}], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap'
  }).addTo(map);
  ${radarLayer}
  L.circleMarker([${lat}, ${lon}], {
    radius: 9, color: '#1B6B3A', weight: 3, fillColor: '#1B6B3A', fillOpacity: 0.85
  }).addTo(map).bindPopup('Lote Llanogrande (8 ha)');
</script>
</body>
</html>`;
}

export function ClimateMapScreen() {
  const coords = useSettingsStore((s) => s.loteCoords);
  const loteNombre = useSettingsStore((s) => s.loteNombre);
  const { online } = useNetworkStatus();
  const [radarUrl, setRadarUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const cargar = useCallback(() => {
    setReady(false);
    fetchRainViewerLayer()
      .then((l) => setRadarUrl(l?.urlTemplate ?? null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    // Carga del índice de RainViewer al conectar (sincronización con red).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (online) cargar();
  }, [online, cargar]);

  return (
    <View style={styles.screen}>
      <BrandHeader title="Mapa clima" subtitle={loteNombre} />

      {!WebViewComp ? (
        <View style={styles.center}>
          <Ionicons name="cloud-download" size={44} color={colors.brand.primary} />
          <AppText variant="subtitle" center>
            Mapa disponible tras actualizar la app
          </AppText>
          <AppText variant="body" center color={colors.textSecondary}>
            Esta versión instalada no incluye el componente de mapa. Instala el último build de la app
            para ver OpenStreetMap y el radar de lluvia. El resto de la app funciona normalmente.
          </AppText>
        </View>
      ) : !online ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline" size={44} color={colors.textSecondary} />
          <AppText variant="subtitle" center>
            Sin conexión
          </AppText>
          <AppText variant="body" center color={colors.textSecondary}>
            El mapa necesita internet para cargar OpenStreetMap y el radar.
          </AppText>
        </View>
      ) : !ready ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <AppText variant="body" color={colors.textSecondary} style={styles.gap}>
            Cargando mapa…
          </AppText>
        </View>
      ) : (
        <View style={styles.flex}>
          <WebViewComp
            originWhitelist={['*']}
            source={{ html: buildLeafletHtml(coords.lat, coords.lon, radarUrl) }}
            style={styles.flex}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
          />
          <Card style={styles.legend} elevation="md">
            <View style={styles.legendRow}>
              <Ionicons name="rainy" size={16} color={colors.brand.primary} />
              <AppText variant="caption" color={colors.textSecondary}>
                {radarUrl
                  ? 'Radar de precipitación (RainViewer) · base OpenStreetMap'
                  : 'OpenStreetMap · radar no disponible ahora'}
              </AppText>
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  gap: { marginTop: spacing.sm },
  legend: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
