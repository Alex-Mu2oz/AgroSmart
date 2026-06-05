import { describe, expect, it } from 'vitest';
import { validarEntrada } from '@core/calc/validarEntrada';
import type { EntradaSesion } from '@core/models';

const base = (over: Partial<EntradaSesion> = {}): EntradaSesion => ({
  areaLoteHa: 8,
  coordenadas: { lat: 2.6833, lon: -75.3167, hdop: 1 },
  items: [{ productoId: 'agrotin', dosisPlaneada: 0.25 }],
  concentracionObjetivoMlL: 10,
  capacidadTanqueL: 40,
  rol: 'operador',
  ...over,
});

describe('M1 — validarEntrada', () => {
  it('entrada válida del caso AGROTIN pasa sin errores', () => {
    const r = validarEntrada(base());
    expect(r.ok).toBe(true);
    expect(r.errores).toHaveLength(0);
  });

  it('área fuera de rango (0 o >50) es error', () => {
    expect(validarEntrada(base({ areaLoteHa: 0 })).ok).toBe(false);
    expect(validarEntrada(base({ areaLoteHa: 60 })).ok).toBe(false);
  });

  it('coordenadas fuera de rango son error', () => {
    expect(validarEntrada(base({ coordenadas: { lat: 200, lon: 0 } })).ok).toBe(false);
  });

  it('HDOP ≥ 5 es advertencia (no bloquea)', () => {
    const r = validarEntrada(base({ coordenadas: { lat: 2.6, lon: -75.3, hdop: 7 } }));
    expect(r.ok).toBe(true);
    expect(r.advertencias.some((a) => a.campo === 'coordenadas.hdop')).toBe(true);
  });

  it('volumen objetivo > 5× tanque es error', () => {
    expect(validarEntrada(base({ volumenTotalObjetivoL: 201, capacidadTanqueL: 40 })).ok).toBe(false);
    expect(validarEntrada(base({ volumenTotalObjetivoL: 200, capacidadTanqueL: 40 })).ok).toBe(true);
  });

  it('sin productos o dosis ≤ 0 es error', () => {
    expect(validarEntrada(base({ items: [] })).ok).toBe(false);
    expect(validarEntrada(base({ items: [{ productoId: 'agrotin', dosisPlaneada: 0 }] })).ok).toBe(false);
  });
});
