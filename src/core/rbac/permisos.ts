import type { Rol } from '@core/models';

/**
 * Matriz de permisos (RBAC) — fuente ÚNICA de verdad (Tabla 6, sec. 9.3.5).
 * 9 funcionalidades × 3 roles. La UI y el dominio consumen esta tabla; nadie
 * la duplica.
 */

export type Permiso =
  | 'VER_HISTORIAL'
  | 'CREAR_SESION'
  | 'MODIFICAR_DOSIS'
  | 'OVERRIDE_AMARILLA'
  | 'OVERRIDE_ROJA'
  | 'EXPORTAR_REPORTES'
  | 'EDITAR_PRODUCTOS'
  | 'AGREGAR_LOTE'
  | 'DASHBOARD_KPIS';

export const MATRIZ_PERMISOS: Record<Permiso, readonly Rol[]> = {
  VER_HISTORIAL: ['agricultor', 'supervisor', 'operador'],
  CREAR_SESION: ['supervisor', 'operador'],
  MODIFICAR_DOSIS: ['supervisor', 'operador'],
  OVERRIDE_AMARILLA: ['supervisor', 'operador'],
  OVERRIDE_ROJA: ['operador'], // con confirmación + motivo (ver M5)
  EXPORTAR_REPORTES: ['agricultor', 'supervisor'],
  EDITAR_PRODUCTOS: ['supervisor'],
  AGREGAR_LOTE: ['agricultor'],
  DASHBOARD_KPIS: ['agricultor', 'supervisor'],
};
