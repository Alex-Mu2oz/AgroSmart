import { describe, expect, it } from 'vitest';
import { evaluarTecnica } from '@core/calc/evaluarTecnica';
import type { MezclaCalculada, Producto } from '@core/models';
import { AGROTIN, PRODUCTOS } from './fixtures';

const mezcla = (over: Partial<MezclaCalculada> = {}): MezclaCalculada => ({
  porProducto: [
    { productoId: 'agrotin', dosisTotalL: 2, volumenProductoL: 2, concentracionResultanteMlL: 10 },
  ],
  volumenAguaL: 198,
  volumenTotalL: 200,
  cargaQuimicaPct: 5,
  ordenAdicion: ['agrotin'],
  ...over,
});

describe('M3 — evaluarTecnica (reglas IF-THEN R1–R4)', () => {
  it('mezcla en límite de etiqueta y baja carga → verde', () => {
    const v = evaluarTecnica(mezcla(), PRODUCTOS);
    expect(v.estado).toBe('verde');
    expect(v.alertas).toHaveLength(0);
  });

  it('R1: concentración 21.6 > 10 ml/L (caso AS-IS) → alerta ROJA', () => {
    const v = evaluarTecnica(
      mezcla({
        porProducto: [
          { productoId: 'agrotin', dosisTotalL: 2, volumenProductoL: 2, concentracionResultanteMlL: 21.6 },
        ],
      }),
      PRODUCTOS,
    );
    expect(v.estado).toBe('rojo');
    expect(v.alertas.some((a) => a.codigo === 'R1_CONCENTRACION_MAX')).toBe(true);
  });

  it('R1: concentración por debajo del mínimo → amarillo', () => {
    const v = evaluarTecnica(
      mezcla({
        porProducto: [
          { productoId: 'agrotin', dosisTotalL: 2, volumenProductoL: 2, concentracionResultanteMlL: 3 },
        ],
      }),
      PRODUCTOS,
    );
    expect(v.estado).toBe('amarillo');
    expect(v.alertas[0]?.codigo).toBe('R1_CONCENTRACION_MIN');
  });

  it('R2: carga química 25 % → amarillo; 35 % → rojo', () => {
    expect(evaluarTecnica(mezcla({ cargaQuimicaPct: 25 }), PRODUCTOS).estado).toBe('amarillo');
    expect(evaluarTecnica(mezcla({ cargaQuimicaPct: 35 }), PRODUCTOS).estado).toBe('rojo');
  });

  it('R3: productos incompatibles → rojo', () => {
    const a: Producto = { ...AGROTIN, incompatibles: ['bispiribac'] };
    const b: Producto = { ...PRODUCTOS[1]!, incompatibles: [] };
    const v = evaluarTecnica(
      mezcla({
        porProducto: [
          { productoId: 'agrotin', dosisTotalL: 2, volumenProductoL: 2, concentracionResultanteMlL: 10 },
          { productoId: 'bispiribac', dosisTotalL: 1, volumenProductoL: 1, concentracionResultanteMlL: 5 },
        ],
      }),
      [a, b],
    );
    expect(v.estado).toBe('rojo');
    expect(v.alertas.some((al) => al.codigo === 'R3_INCOMPATIBLE')).toBe(true);
  });

  it('R4: el estado consolidado es el máximo de las severidades', () => {
    // concentración baja (amarillo) + carga roja → rojo
    const v = evaluarTecnica(
      mezcla({
        cargaQuimicaPct: 35,
        porProducto: [
          { productoId: 'agrotin', dosisTotalL: 2, volumenProductoL: 2, concentracionResultanteMlL: 3 },
        ],
      }),
      PRODUCTOS,
    );
    expect(v.estado).toBe('rojo');
    expect(v.alertas.length).toBeGreaterThanOrEqual(2);
  });
});
