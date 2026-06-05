import { describe, expect, it } from 'vitest';
import { permisosDe, puede } from '@core/rbac/puede';

describe('RBAC — matriz de permisos (9 funcionalidades × 3 roles)', () => {
  it('solo el operador puede override de alerta roja', () => {
    expect(puede('operador', 'OVERRIDE_ROJA')).toBe(true);
    expect(puede('supervisor', 'OVERRIDE_ROJA')).toBe(false);
    expect(puede('agricultor', 'OVERRIDE_ROJA')).toBe(false);
  });

  it('el agricultor no puede crear sesión; supervisor y operador sí', () => {
    expect(puede('agricultor', 'CREAR_SESION')).toBe(false);
    expect(puede('supervisor', 'CREAR_SESION')).toBe(true);
    expect(puede('operador', 'CREAR_SESION')).toBe(true);
  });

  it('los tres roles pueden ver historial', () => {
    expect(puede('agricultor', 'VER_HISTORIAL')).toBe(true);
    expect(puede('supervisor', 'VER_HISTORIAL')).toBe(true);
    expect(puede('operador', 'VER_HISTORIAL')).toBe(true);
  });

  it('solo el agricultor agrega lote; solo el supervisor edita productos', () => {
    expect(puede('agricultor', 'AGREGAR_LOTE')).toBe(true);
    expect(puede('supervisor', 'AGREGAR_LOTE')).toBe(false);
    expect(puede('supervisor', 'EDITAR_PRODUCTOS')).toBe(true);
    expect(puede('operador', 'EDITAR_PRODUCTOS')).toBe(false);
  });

  it('exportar reportes: agricultor y supervisor, no operador', () => {
    expect(puede('agricultor', 'EXPORTAR_REPORTES')).toBe(true);
    expect(puede('supervisor', 'EXPORTAR_REPORTES')).toBe(true);
    expect(puede('operador', 'EXPORTAR_REPORTES')).toBe(false);
  });

  it('permisosDe devuelve el conjunto correcto por rol', () => {
    expect(permisosDe('operador')).toEqual(
      expect.arrayContaining(['VER_HISTORIAL', 'CREAR_SESION', 'OVERRIDE_ROJA']),
    );
    expect(permisosDe('operador')).not.toContain('EXPORTAR_REPORTES');
  });
});
