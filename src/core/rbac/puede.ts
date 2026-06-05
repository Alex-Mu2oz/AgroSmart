import type { Rol } from '@core/models';
import { MATRIZ_PERMISOS, type Permiso } from '@core/rbac/permisos';

/** ¿El rol tiene el permiso? Única función de chequeo RBAC. */
export function puede(rol: Rol, permiso: Permiso): boolean {
  return MATRIZ_PERMISOS[permiso].includes(rol);
}

/** Lista de permisos que un rol posee (útil para filtrar tabs/acciones). */
export function permisosDe(rol: Rol): Permiso[] {
  return (Object.keys(MATRIZ_PERMISOS) as Permiso[]).filter((p) => puede(rol, p));
}
