import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchRainViewerLayer, type RainViewerLayer } from '@services/rainviewer/indexService';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useNetworkStatus } from '@shared/hooks/useNetworkStatus';
import { AppText, Card, OfflineBanner } from '@shared/ui/components';
import { colors, spacing } from '@shared/ui/theme';

/**
 * Mapa real con react-native-maps + radar RainViewer. Este componente se carga
 * SOLO en development build (nunca en Expo Go, ver ClimateMapScreen), porque
 * react-native-maps es un módulo nativo.
 */
const REFRESH_MS = 5 * 60 * 1000;

export function RealClimateMap() {
  const insets = useSafeAreaInsets();
  const coords = useSettingsStore((s) => s.loteCoords);
  const { online } = useNetworkStatus();
  const [layer, setLayer] = useState<RainViewerLayer | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let activo = true;
    const refrescar = () => {
      fetchRainViewerLayer().then((l) => {
        if (activo) setLayer(l);
      });
    };
    refrescar();
    timer.current = setInterval(refrescar, REFRESH_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refrescar();
    });
    return () => {
      activo = false;
      if (timer.current) clearInterval(timer.current);
      sub.remove();
    };
  }, []);

  return (
    <View style={styles.screen}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: coords.lat,
          longitude: coords.lon,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        {layer ? (
          <UrlTile key={layer.frameKey} urlTemplate={layer.urlTemplate} maximumZ={layer.maximumZ} zIndex={1} opacity={0.6} />
        ) : null}
        <Marker coordinate={{ latitude: coords.lat, longitude: coords.lon }} title="Lote Llanogrande" />
      </MapView>

      <View style={[styles.overlay, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        {!online ? <OfflineBanner /> : null}
        <Card style={styles.leyenda}>
          <AppText variant="caption" color={colors.textSecondary}>
            {layer
              ? 'Radar de precipitación (RainViewer) · vista contextual'
              : 'Radar no disponible · se muestra el mapa base'}
          </AppText>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  map: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlay: { paddingHorizontal: spacing.md, gap: spacing.sm },
  leyenda: { alignSelf: 'flex-start' },
});
