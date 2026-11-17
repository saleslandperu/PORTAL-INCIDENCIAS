import { db } from "../db.ts";
import {
  ALL_PERMISSION_IDS,
  DEFAULT_ROLE_PERMISSIONS,
  effectivePermissions,
  PERMISSION_GROUPS,
  sanitizeGrants,
} from "../permissionCatalog.ts";
import { ROLE_IDS, type RoleId } from "../permissions.ts";

export function seedPermissionCatalog() {
  const insertPermission = db.prepare(
    "INSERT OR IGNORE INTO permissions (id, group_id, label, sort_order) VALUES (?, ?, ?, ?)",
  );
  let order = 0;
  for (const group of PERMISSION_GROUPS) {
    for (const item of group.items) {
      insertPermission.run(item.id, group.id, item.label, order);
      order += 1;
    }
  }

  const countStmt = db.prepare("SELECT COUNT(*) AS n FROM role_permissions WHERE role_id = ?");
  const insertGrant = db.prepare("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)");

  for (const id of ALL_PERMISSION_IDS) {
    insertGrant.run("admin_ti", id);
  }

  for (const role of ROLE_IDS) {
    if (role === "admin_ti") continue;
    const row = countStmt.get(role) as { n: number };
    if (Number(row?.n ?? 0) > 0) continue;
    for (const permissionId of DEFAULT_ROLE_PERMISSIONS[role] ?? []) {
      insertGrant.run(role, permissionId);
    }
  }
}

export function storedPermissionsByRole(): Record<string, string[]> {
  const rows = db.prepare("SELECT role_id, permission_id FROM role_permissions").all() as unknown as {
    role_id: string;
    permission_id: string;
  }[];
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    if (!map[row.role_id]) map[row.role_id] = [];
    map[row.role_id].push(row.permission_id);
  }
  return map;
}

export function permissionsOfRoles(roles: string[]): string[] {
  return [...effectivePermissions(roles, storedPermissionsByRole())];
}

export function roleHasPermission(roles: string[], permissionId: string) {
  return permissionsOfRoles(roles).includes(permissionId);
}

export function listProfiles() {
  const stored = storedPermissionsByRole();
  return ROLE_IDS.map((id) => {
    const grants = id === "admin_ti" ? [...ALL_PERMISSION_IDS] : (stored[id] ?? [...(DEFAULT_ROLE_PERMISSIONS[id] ?? [])]);
    return {
      id,
      locked: id === "admin_ti",
      permissionIds: grants.filter((item) => item !== "profiles.manage" || id === "admin_ti"),
    };
  });
}

export function saveRolePermissions(roleId: RoleId, permissionIds: string[]) {
  if (roleId === "admin_ti") {
    const insert = db.prepare("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
    for (const id of ALL_PERMISSION_IDS) insert.run("admin_ti", id);
    return listProfiles().find((item) => item.id === roleId);
  }
  const grants = sanitizeGrants(roleId, permissionIds);
  db.prepare("DELETE FROM role_permissions WHERE role_id = ?").run(roleId);
  const insert = db.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
  for (const id of grants) insert.run(roleId, id);
  return listProfiles().find((item) => item.id === roleId);
}
