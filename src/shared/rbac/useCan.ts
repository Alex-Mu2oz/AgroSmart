import { puede } from '@core/rbac/puede';
import type { Permiso } from '@core/rbac/permisos';
import { useProfileStore } from '@stores/useProfileStore';

/** Hook de RBAC para presentación: ¿el rol activo puede `permiso`? */
export function useCan(permiso: Permiso): boolean {
  const rol = useProfileStore((s) => s.rol);
  return rol ? puede(rol, permiso) : false;
}
