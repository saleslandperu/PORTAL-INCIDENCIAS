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

export const DEFAULT_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  admin_ti: ALL_PERMISSION_IDS,
  gerente: ["nav.dashboard", "nav.incidents", "nav.reports", "incidents.view"],
  kam: ["nav.dashboard", "nav.incidents", "incidents.view"],
  tecnico_ti: ["nav.dashboard", "nav.incidents", "nav.reports", "nav.settings", "incidents.view"],
  consulta: ["nav.dashboard", "nav.incidents", "nav.reports", "incidents.view"],
};

export function hasPermission(ids: string[] | undefined, permissionId: string) {
  return Boolean(ids?.includes(permissionId));
}

export function homePath(permissionIds: string[] | undefined) {
  if (hasPermission(permissionIds, "nav.dashboard")) return "/";
  if (hasPermission(permissionIds, "nav.incidents")) return "/incidencias";
  if (hasPermission(permissionIds, "nav.reports")) return "/reportes";
  if (hasPermission(permissionIds, "nav.settings")) return "/configuracion";
  if (hasPermission(permissionIds, "users.view")) return "/usuarios";
  if (hasPermission(permissionIds, "cost_centers.manage")) return "/centros-de-costo";
  if (hasPermission(permissionIds, "profiles.manage")) return "/perfiles-y-permisos";
  return "/";
}
