import { describe, expect, it } from 'vitest';
import { calcularVentana72h, estadoHora } from '@core/calc/ventana72h';
import type { ClimaHorario } from '@core/models';
import { CLIMA_VERDE, climaHorario } from './fixtures';

describe('M4 — ventana72h', () => {
  it('devuelve el primer bloque verde del pronóstico', () => {
    // 3 h rojas (viento alto) seguidas de horas verdes
    const rojas = climaHorario(3, { ...CLIMA_VERDE, vientoMs: 6 }, 6);
    const verdes = climaHorario(5, CLIMA_VERDE, 9);
    const v = calcularVentana72h([...rojas, ...verdes], 100);
    expect(v).not.toBeNull();
    expect(v?.iso).toBe('2026-06-04T09:00');
    expect(v?.estado).toBe('verde');
  });

  it('devuelve null si ningún bloque es verde', () => {
    const todasRojas: ClimaHorario[] = climaHorario(72, { ...CLIMA_VERDE, vientoMs: 8 });
    expect(calcularVentana72h(todasRojas, 100)).toBeNull();
  });

  it('una distancia a agua roja impide ventana verde aun con clima ideal', () => {
    const v = calcularVentana72h(climaHorario(24, CLIMA_VERDE), 10);
    expect(v).toBeNull();
  });

  it('estadoHora aplica la regla roja→no verde', () => {
    expect(estadoHora({ ...CLIMA_VERDE, iso: 'x' }, 100)).toBe('verde');
    expect(estadoHora({ ...CLIMA_VERDE, iso: 'x' }, 10)).toBe('amarillo');
  });
});
