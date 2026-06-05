import { describe, expect, it } from 'vitest';
import {
  construirPanel,
  payloadCanonico,
  resolverDecision,
  type ContextoCierre,
} from '@core/calc/decision';
import type { EvaluacionAmbiental, MezclaCalculada, ValidacionTecnica } from '@core/models';

const mezcla: MezclaCalculada = {
  porProducto: [
    { productoId: 'agrotin', dosisTotalL: 2, volumenProductoL: 2, concentracionResultanteMlL: 10 },
  ],
  volumenAguaL: 198,
  volumenTotalL: 200,
  cargaQuimicaPct: 5,
  ordenAdicion: ['agrotin'],
};

const ambiental = (estado: EvaluacionAmbiental['estado']): EvaluacionAmbiental => ({
  estado,
  scoreGlobal: estado === 'verde' ? 0 : estado === 'amarillo' ? 3 : 9,
  variables: [],
  ventanaSugerida: null,
  antiguedadMin: 0,
  alertas: [],
});

const tecnica = (estado: ValidacionTecnica['estado']): ValidacionTecnica => ({ estado, alertas: [] });

const ctx = (over: Partial<ContextoCierre> = {}): ContextoCierre => ({
  sesionId: 's1',
  creadaEn: '2026-06-04T08:00:00Z',
  cerradaEn: '2026-06-04T08:04:00Z',
  rol: 'operador',
  geolocalizacion: { lat: 2.6833, lon: -75.3167 },
  ...over,
});

describe('M5 — construirPanel / resolverDecision', () => {
  it('semáforo global = max(técnico, ambiental)', () => {
    expect(construirPanel(tecnica('verde'), ambiental('amarillo'), mezcla).semaforoGlobal).toBe('amarillo');
    expect(construirPanel(tecnica('rojo'), ambiental('verde'), mezcla).semaforoGlobal).toBe('rojo');
    expect(construirPanel(tecnica('verde'), ambiental('verde'), mezcla).semaforoGlobal).toBe('verde');
  });

  it('verde + aplicar → recomendacion_seguida', () => {
    const panel = construirPanel(tecnica('verde'), ambiental('verde'), mezcla);
    const r = resolverDecision(panel, { accion: 'aplicar' }, ctx());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tipoDecision).toBe('recomendacion_seguida');
  });

  it('amarillo + aplicar → precaucion_aceptada', () => {
    const panel = construirPanel(tecnica('amarillo'), ambiental('verde'), mezcla);
    const r = resolverDecision(panel, { accion: 'aplicar' }, ctx({ rol: 'supervisor' }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tipoDecision).toBe('precaucion_aceptada');
  });

  it('rojo + aplicar por NO operador → rol_no_autorizado', () => {
    const panel = construirPanel(tecnica('rojo'), ambiental('verde'), mezcla);
    const r = resolverDecision(panel, { accion: 'aplicar', motivoOverride: 'x'.repeat(25) }, ctx({ rol: 'supervisor' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.tipo).toBe('rol_no_autorizado_override_rojo');
  });

  it('rojo + aplicar por operador SIN motivo suficiente → motivo_requerido', () => {
    const panel = construirPanel(tecnica('rojo'), ambiental('verde'), mezcla);
    const r = resolverDecision(panel, { accion: 'aplicar', motivoOverride: 'corto' }, ctx());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.tipo).toBe('motivo_requerido');
  });

  it('rojo + aplicar por operador con motivo ≥20 → override_alerta_roja', () => {
    const panel = construirPanel(tecnica('rojo'), ambiental('verde'), mezcla);
    const motivo = 'Condiciones locales aceptables verificadas en campo';
    const r = resolverDecision(panel, { accion: 'aplicar', motivoOverride: motivo }, ctx());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.tipoDecision).toBe('override_alerta_roja');
      expect(r.bitacora.motivoOverride).toBe(motivo);
    }
  });

  it('postergar siempre es válido y no exige motivo', () => {
    const panel = construirPanel(tecnica('rojo'), ambiental('rojo'), mezcla);
    const r = resolverDecision(panel, { accion: 'postergar' }, ctx({ rol: 'supervisor' }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tipoDecision).toBe('postergada');
  });
});

describe('M5 — payloadCanonico (determinista, sin checksum)', () => {
  it('produce el mismo string sin importar el orden de claves', () => {
    const panel = construirPanel(tecnica('verde'), ambiental('verde'), mezcla);
    const r = resolverDecision(panel, { accion: 'aplicar' }, ctx());
    if (!r.ok) throw new Error('esperado ok');
    const a = payloadCanonico({ ...r.bitacora, checksum: 'AAA' });
    const b = payloadCanonico({ ...r.bitacora, checksum: 'BBB' });
    expect(a).toBe(b); // el checksum no afecta el payload canónico
  });
});
