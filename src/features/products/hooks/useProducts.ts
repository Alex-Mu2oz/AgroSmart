import { useCallback, useEffect, useState } from 'react';
import type { Producto } from '@core/models';
import { productRepo } from '@data/repos/productRepo';

type Estado = 'loading' | 'ready' | 'error';

/** Carga la base de productos desde SQLite. */
export function useProducts() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [estado, setEstado] = useState<Estado>('loading');

  const recargar = useCallback(() => {
    setEstado('loading');
    productRepo
      .getAll()
      .then((p) => {
        setProductos(p);
        setEstado('ready');
      })
      .catch(() => setEstado('error'));
  }, []);

  useEffect(() => {
    // Carga inicial desde SQLite (sincronización con sistema externo): el
    // setState('loading') inicial es intencional al montar/refrescar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar();
  }, [recargar]);

  return { productos, estado, recargar };
}
