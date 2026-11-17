export const PERMISSION_GROUPS = [
  {
    id: "nav",
    label: "Navegación y consultas",
    items: [
      { id: "nav.dashboard", label: "Ver Dashboard" },
      { id: "nav.incidents", label: "Ver incidencias" },
      { id: "nav.reports", label: "Ver reportes" },
      { id: "nav.settings", label: "Ver Configuración" },
    ],
  },
  {
    id: "admin",
    label: "Administración",
    items: [
      { id: "users.view", label: "Ver usuarios" },
      { id: "users.create", label: "Crear usuarios" },
      { id: "users.edit", label: "Editar usuarios" },
      { id: "users.toggle_status", label: "Activar y desactivar usuarios" },
      { id: "cost_centers.manage", label: "Gestionar centros de costo" },
      { id: "profiles.manage", label: "Gestionar perfiles y permisos" },
    ],
  },
  {
    id: "incidents",
    label: "Gestión de incidencias",
    items: [
      { id: "incidents.view", label: "Ver incidencias" },
      { id: "incidents.create", label: "Crear incidencias" },
      { id: "incidents.edit", label: "Editar incidencias" },
      { id: "incidents.close", label: "Cerrar incidencias" },
    ],
  },
] as const;

export type PermissionId = (typeof PERMISSION_GROUPS)[number]["items"][number]["id"];

export const ALL_PERMISSION_IDS: PermissionId[] = PERMISSION_GROUPS.flatMap((group) =>
  group.items.map((item) => item.id),
);

/** Solo Administrador TI puede gestionar perfiles; no se concede a otros roles. */
export const LOCKED_TO_ADMIN: PermissionId[] = ["profiles.manage"];

const NAV_QUERY = ["nav.dashboard", "nav.incidents", "nav.reports", "incidents.view"] as const;
const TECNICO_CURRENT = ["nav.dashboard", "nav.incidents", "nav.reports", "nav.settings", "incidents.view"] as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  admin_ti: ALL_PERMISSION_IDS,
  gerente: NAV_QUERY,
  kam: ["nav.dashboard", "nav.incidents", "incidents.view"],
  tecnico_ti: TECNICO_CURRENT,
  consulta: NAV_QUERY,
};

export function effectivePermissions(roles: string[], storedByRole: Record<string, string[]>): Set<string> {
  if (roles.includes("admin_ti")) return new Set(ALL_PERMISSION_IDS);
  const granted = new Set<string>();
  for (const role of roles) {
    const stored = storedByRole[role];
    const list = stored ?? DEFAULT_ROLE_PERMISSIONS[role] ?? [];
    for (const id of list) {
      if (LOCKED_TO_ADMIN.includes(id as PermissionId) && role !== "admin_ti") continue;
      granted.add(id);
    }
  }
  return granted;
}

export function sanitizeGrants(roleId: string, requested: string[]): string[] {
  if (roleId === "admin_ti") return [...ALL_PERMISSION_IDS];
  const allowed = new Set(ALL_PERMISSION_IDS);
  return [...new Set(requested)].filter(
    (id) => allowed.has(id as PermissionId) && !LOCKED_TO_ADMIN.includes(id as PermissionId),
  );
}
