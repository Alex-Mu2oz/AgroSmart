import { describe, expect, it } from 'vitest';
import { calcularMezcla } from '@core/calc/calcularMezcla';
import type { EntradaSesion } from '@core/models';
import { isErr, isOk, unwrap } from '@core/result';
import { AGROTIN, PRODUCTOS } from './fixtures';

const baseEntrada = (over: Partial<EntradaSesion> = {}): EntradaSesion => ({
  areaLoteHa: 8,
  coordenadas: { lat: 2.6833, lon: -75.3167, hdop: 1 },
  items: [{ productoId: 'agrotin', dosisPlaneada: 0.25 }],
  concentracionObjetivoMlL: 10,
  capacidadTanqueL: 40,
  rol: 'operador',
  ...over,
});

describe('M2 — calcularMezcla (caso ancla AGROTIN, Anexo I)', () => {
  it('reproduce exactamente el ejemplo del Anexo I', () => {
    const r = calcularMezcla(baseEntrada(), PRODUCTOS);
    expect(isOk(r)).toBe(true);
    const m = unwrap(r);

    // D_total = 0.25 × 8 = 2 L
    expect(m.porProducto[0]?.dosisTotalL).toBeCloseTo(2, 6);
    // V_agua = (2000 / 10) − 2 = 198 L
    expect(m.volumenAguaL).toBeCloseTo(198, 6);
    // V_total = 200 L
    expect(m.volumenTotalL).toBeCloseTo(200, 6);
    // Carga_Q = (2 / 40) × 100 = 5 %
    expect(m.cargaQuimicaPct).toBeCloseTo(5, 6);
    // C resultante = 10 ml/L (en el máximo de etiqueta)
    expect(m.porProducto[0]?.concentracionResultanteMlL).toBeCloseTo(10, 6);
  });

  it('orden de adición coloca al coadyuvante AGROTIN al final (W-A-L-E-S)', () => {
    const r = calcularMezcla(
      baseEntrada({
        items: [
          { productoId: 'agrotin', dosisPlaneada: 0.25 }, // surfactant (S)
          { productoId: 'pendimetalina', dosisPlaneada: 3 }, // EC (E)
          { productoId: 'bispiribac', dosisPlaneada: 0.125 }, // soluble (A)
        ],
      }),
      PRODUCTOS,
    );
    const m = unwrap(r);
    expect(m.ordenAdicion).toEqual(['bispiribac', 'pendimetalina', 'agrotin']);
  });

  it('devuelve error si el volumen de agua resulta negativo', () => {
    // C_obj muy alta → V_total pequeño < Σ V_productos
    const r = calcularMezcla(baseEntrada({ concentracionObjetivoMlL: 100000 }), PRODUCTOS);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.tipo).toBe('volumen_insuficiente');
  });

  it('devuelve error si un producto no existe en la base', () => {
    const r = calcularMezcla(
      baseEntrada({ items: [{ productoId: 'inexistente', dosisPlaneada: 1 }] }),
      PRODUCTOS,
    );
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.tipo).toBe('producto_no_encontrado');
  });

  it('reproduce el caso AS-IS observado (V_total≈92.6 L → C≈21.6 ml/L)', () => {
    // El operador buscó una concentración alta (21.6) → sobredosificación
    const r = calcularMezcla(baseEntrada({ concentracionObjetivoMlL: 21.6 }), PRODUCTOS);
    const m = unwrap(r);
    expect(m.porProducto[0]?.concentracionResultanteMlL).toBeCloseTo(21.6, 4);
    expect(AGROTIN.concentracionMaxMlL).toBe(10); // que luego M3 marcará como rojo
  });
});
