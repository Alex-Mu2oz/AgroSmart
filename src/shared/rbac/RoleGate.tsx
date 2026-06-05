import type { ReactNode } from 'react';
import type { Permiso } from '@core/rbac/permisos';
import { useCan } from '@shared/rbac/useCan';

interface RoleGateProps {
  permiso: Permiso;
  children: ReactNode;
  /** Qué mostrar si el rol no tiene permiso (por defecto, nada). */
  fallback?: ReactNode;
}

/** Renderiza `children` solo si el rol activo tiene el permiso. */
export function RoleGate({ permiso, children, fallback = null }: RoleGateProps) {
  return useCan(permiso) ? <>{children}</> : <>{fallback}</>;
}
