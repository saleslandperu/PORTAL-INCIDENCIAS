import { primaryRole, ROLE_IDS } from "./permissions.ts";

/**
 * Alcance de tickets de un usuario. Mismas reglas que buildAccessScope en el frontend,
 * pero aquí es la fuente de verdad: el backend nunca envía tickets fuera del alcance.
 */
export type TicketScope = { all: true } | { all: false; costCenterIds: Set<string> };

export interface ScopeInput {
  roles: string[];
  /** Centros de costo asignados directamente al usuario. */
  directCostCenterIds: string[];
  /** Solo gerente: centros de costo de los KAM activos a su cargo. */
  managedKamCostCenterIds: string[];
}

export function resolveTicketScope(input: ScopeInput): TicketScope {
  // primaryRole cae en "consulta" (alcance total) si no hay rol conocido: aquí se cierra en su lugar.
  if (!input.roles.some((r) => (ROLE_IDS as readonly string[]).includes(r))) {
    return { all: false, costCenterIds: new Set() };
  }
  const role = primaryRole(input.roles);
  if (role === "admin_ti" || role === "consulta") return { all: true };
  if (role === "tecnico_ti" && input.directCostCenterIds.length === 0) return { all: true };
  const ids = role === "gerente"
    ? [...input.directCostCenterIds, ...input.managedKamCostCenterIds]
    : input.directCostCenterIds;
  return { all: false, costCenterIds: new Set(ids) };
}

/** Los tickets sin centro de costo solo los ve quien tiene alcance total. */
export function ticketInScope(scope: TicketScope, costCenterId: string | null | undefined): boolean {
  if (scope.all) return true;
  return Boolean(costCenterId) && scope.costCenterIds.has(costCenterId as string);
}
