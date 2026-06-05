import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Estado de conectividad reactivo. `online` es true cuando hay red utilizable.
 * Se usa para el OfflineBanner y para decidir si intentar fetch o ir a caché.
 */
export function useNetworkStatus(): { online: boolean } {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const usable = !!state.isConnected && state.isInternetReachable !== false;
      setOnline(usable);
    });
    NetInfo.fetch().then((state) => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
    return () => unsub();
  }, []);

  return { online };
}
