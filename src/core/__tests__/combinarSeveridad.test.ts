import { describe, expect, it } from 'vitest';
import { combinarSeveridad } from '@core/calc/combinarSeveridad';

describe('combinarSeveridad (verde < amarillo < rojo)', () => {
  it('sin argumentos → verde', () => {
    expect(combinarSeveridad()).toBe('verde');
  });
  it('toma la máxima severidad', () => {
    expect(combinarSeveridad('verde', 'amarillo')).toBe('amarillo');
    expect(combinarSeveridad('amarillo', 'rojo', 'verde')).toBe('rojo');
    expect(combinarSeveridad('verde', 'verde')).toBe('verde');
  });
});
