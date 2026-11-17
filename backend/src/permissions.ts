export { ALL_PERMISSION_IDS, DEFAULT_ROLE_PERMISSIONS, effectivePermissions, LOCKED_TO_ADMIN, PERMISSION_GROUPS, sanitizeGrants } from "./permissionCatalog.ts";
export type { PermissionId } from "./permissionCatalog.ts";

export const ROLE_IDS = ["admin_ti", "gerente", "kam", "tecnico_ti", "consulta"] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export function primaryRole(roles: string[]): RoleId {
  for (const preferred of ROLE_IDS) {
    if (roles.includes(preferred)) return preferred;
  }
  return "consulta";
}
