import type {
  CategoriaAdicion,
  EntradaSesion,
  MezclaCalculada,
  Producto,
  ProductoCalculado,
} from '@core/models';
import { err, ok, type Result } from '@core/result';

/**
 * M2 — Cálculo de mezcla y volumen.
 *
 * Invierte la lógica empírica del operador: en vez de partir del agua
 * disponible y agregar productos, parte de la dosis del producto y calcula el
 * agua necesaria para alcanzar la concentración objetivo (C_obj).
 *
 * Fórmulas (Anexo I):
 *   (1) D_total[L]   = D_planeada[L/ha] × A_lote[ha]
 *   (2) C[ml/L]      = (D_total × 1000) / V_total_mezcla[L]
 *   (3) V_agua[L]    = V_total_mezcla − Σ V_productos
 *                      con V_total = (D_total_driver × 1000) / C_obj
 *   (4) Carga_Q[%]   = (Σ V_productos / V_tanque) × 100
 *
 * Caso ancla AGROTIN (8 ha, 0.25 L/ha, C_obj=10 ml/L):
 *   D_total=2 L · V_agua=198 L · V_total=200 L · Carga_Q=5 % · C=10 ml/L.
 */

/** Orden de adición W-A-L-E-S (índice menor = se agrega primero). */
const ORDEN_WALES: Record<CategoriaAdicion, number> = {
  wettable_powder: 0,
  agitated_soluble: 1,
  liquid_flowable: 2,
  emulsifiable_concentrate: 3,
  surfactant: 4,
};

export type ErrorMezcla =
  | { tipo: 'producto_no_encontrado'; productoId: string }
  | { tipo: 'volumen_insuficiente'; vAgua: number }
  | { tipo: 'sin_driver_concentracion' };

export function calcularMezcla(
  entrada: EntradaSesion,
  productos: readonly Producto[],
): Result<MezclaCalculada, ErrorMezcla> {
  const byId = new Map(productos.map((p) => [p.id, p]));

  // (1) D_total y volumen aportado por cada producto.
  const calculados: (ProductoCalculado & { categoria: CategoriaAdicion })[] = [];
  for (const item of entrada.items) {
    const prod = byId.get(item.productoId);
    if (!prod) return err({ tipo: 'producto_no_encontrado', productoId: item.productoId });

    const dosisTotalL = item.dosisPlaneada * entrada.areaLoteHa;
    // El volumen de líquido aportado al tanque = dosis en L (densidad ≈ 1).
    const volumenProductoL = dosisTotalL / (prod.densidad ?? 1);

    calculados.push({
      productoId: prod.id,
      dosisTotalL,
      volumenProductoL,
      concentracionResultanteMlL: 0, // se completa tras conocer V_total
      categoria: prod.categoriaAdicion,
    });
  }

  const sumaVProductos = calculados.reduce((acc, c) => acc + c.volumenProductoL, 0);

  // Driver de concentración: producto con límites ml/L (p.ej. AGROTIN).
  // Si ninguno los declara, se usa el primero (caso mono-producto).
  const driver =
    entrada.items.find((it) => byId.get(it.productoId)?.concentracionMaxMlL !== undefined) ??
    entrada.items[0];
  if (!driver) return err({ tipo: 'sin_driver_concentracion' });
  const dCalcDriver = calculados.find((c) => c.productoId === driver.productoId);
  if (!dCalcDriver) return err({ tipo: 'sin_driver_concentracion' });

  // V_total para que el driver alcance C_obj.  (D_total_ml / C_obj)
  const volumenTotalL = (dCalcDriver.dosisTotalL * 1000) / entrada.concentracionObjetivoMlL;

  // (3) V_agua
  const volumenAguaL = volumenTotalL - sumaVProductos;
  if (volumenAguaL < 0) {
    return err({ tipo: 'volumen_insuficiente', vAgua: volumenAguaL });
  }

  // (2) concentración resultante por producto
  for (const c of calculados) {
    c.concentracionResultanteMlL = (c.dosisTotalL * 1000) / volumenTotalL;
  }

  // (4) carga química
  const cargaQuimicaPct = (sumaVProductos / entrada.capacidadTanqueL) * 100;

  // Orden de adición W-A-L-E-S (estable por categoría).
  const ordenAdicion = [...calculados]
    .sort((a, b) => ORDEN_WALES[a.categoria] - ORDEN_WALES[b.categoria])
    .map((c) => c.productoId);

  const mezcla: MezclaCalculada = {
    porProducto: calculados.map(({ categoria, ...rest }) => rest),
    volumenAguaL,
    volumenTotalL,
    cargaQuimicaPct,
    ordenAdicion,
  };
  return ok(mezcla);
}
