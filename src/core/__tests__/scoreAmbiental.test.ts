import { describe, expect, it } from 'vitest';
import { scoreAmbiental } from '@core/calc/scoreAmbiental';
import type { ClimaActual, EntradaAmbiental } from '@core/models';
import { CLIMA_VERDE, climaHorario } from './fixtures';

const actualVerde: ClimaActual = {
  temperaturaC: 20,
  humedadRelPct: 60,
  puntoRocioC: 12, // ΔT = 8 → verde
  vientoMs: 2,
  probPrecip2hPct: 5,
};

const entrada = (actual: Partial<ClimaActual>, distanciaAguaM = 100): EntradaAmbiental => ({
  actual: { ...actualVerde, ...actual },
  distanciaAguaM,
  pronostico72h: climaHorario(72, CLIMA_VERDE),
});

describe('M4 — scoreAmbiental (umbrales, pesos, bandas)', () => {
  it('condiciones ideales → score 0 → verde', () => {
    const e = scoreAmbiental(entrada({}));
    expect(e.scoreGlobal).toBe(0);
    expect(e.estado).toBe('verde');
  });

  it('viento 5 m/s (rojo, peso 3) → score 9 → rojo', () => {
    const e = scoreAmbiental(entrada({ vientoMs: 5 }));
    // 3 (peso) × 3 (puntaje rojo) = 9
    expect(e.scoreGlobal).toBe(9);
    expect(e.estado).toBe('rojo');
  });

  it('regla extra: una variable roja con score bajo no puede quedar verde', () => {
    // distancia agua < 15 → rojo (peso 2 → puntaje 3 → aporte 6). score=6 → banda amarillo.
    // Verificamos que NO sea verde y que al menos sea amarillo.
    const e = scoreAmbiental(entrada({}, 10));
    expect(e.scoreGlobal).toBe(6);
    expect(e.estado).toBe('amarillo');
    expect(e.variables.find((v) => v.clave === 'distancia_agua')?.estado).toBe('rojo');
  });

  it('una sola variable amarilla (viento 3.5) → score 3 → amarillo', () => {
    const e = scoreAmbiental(entrada({ vientoMs: 3.5 }));
    expect(e.scoreGlobal).toBe(3); // peso 3 × puntaje 1
    expect(e.estado).toBe('amarillo');
  });

  it('propaga la antigüedad del dato (modo degradado)', () => {
    const e = scoreAmbiental({ ...entrada({}), antiguedadMin: 90 });
    expect(e.antiguedadMin).toBe(90);
  });

  it('sugiere ventana verde cuando el pronóstico la contiene', () => {
    const e = scoreAmbiental(entrada({ vientoMs: 5 })); // ahora rojo, pero pronóstico verde
    expect(e.ventanaSugerida).not.toBeNull();
    expect(e.ventanaSugerida?.estado).toBe('verde');
  });
});
