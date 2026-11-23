import bcrypt from "bcryptjs";
import { db, newId, nowIso } from "../db.ts";
import { primaryRole, type RoleId } from "../permissions.ts";
import { permissionsOfRoles } from "./rolePermissions.ts";

const USER_PUBLIC_COLUMNS =
  "id, worker_code, full_name, username, email, status, manager_id, created_at, updated_at";

export interface UserRow {
  id: string;
  worker_code: string | null;
  full_name: string;
  username: string;
  email: string;
  status: "activo" | "inactivo";
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UserAuthRow extends UserRow {
  password_hash: string;
}

export function rolesOf(userId: string): string[] {
  const rows = db.prepare("SELECT role_id FROM user_roles WHERE user_id = ?").all(userId) as { role_id: string }[];
  return rows.map((row) => row.role_id);
}

export function costCentersOf(userId: string): string[] {
  const rows = db
    .prepare("SELECT cost_center_id FROM user_cost_centers WHERE user_id = ?")
    .all(userId) as { cost_center_id: string }[];
  return rows.map((row) => row.cost_center_id);
}

/** Centros de costo de los KAM activos cuyo gerente es `managerId`. */
export function costCentersOfManagedKams(managerId: string): string[] {
  const rows = db
    .prepare(
      `SELECT DISTINCT uc.cost_center_id
         FROM users u
         JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'kam'
         JOIN user_cost_centers uc ON uc.user_id = u.id
        WHERE u.manager_id = ? AND u.status = 'activo'`,
    )
    .all(managerId) as { cost_center_id: string }[];
  return rows.map((row) => row.cost_center_id);
}

export function toPublic(user: UserRow) {
  const roles = rolesOf(user.id);
  return {
    id: user.id,
    workerCode: user.worker_code,
    fullName: user.full_name,
    username: user.username,
    email: user.email,
    status: user.status,
    managerId: user.manager_id,
    role: primaryRole(roles),
    roles,
    permissions: permissionsOfRoles(roles),
    costCenterIds: costCentersOf(user.id),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function listUsers() {
  const rows = db.prepare(`SELECT ${USER_PUBLIC_COLUMNS} FROM users ORDER BY full_name`).all() as unknown as UserRow[];
  return rows.map(toPublic);
}

export function findByLogin(identifier: string) {
  const value = identifier.trim().toLowerCase();
  return db
    .prepare("SELECT * FROM users WHERE lower(username) = ? OR lower(email) = ?")
    .get(value, value) as unknown as UserAuthRow | undefined;
}

export function findById(id: string) {
  return db.prepare(`SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE id = ?`).get(id) as unknown as UserRow | undefined;
}

export function resolveUserRef(value?: string | null) {
  if (!value?.trim()) return null;
  const direct = findById(value.trim());
  if (direct) return direct.id;
  return findByLogin(value)?.id ?? null;
}

export async function upsertUser(input: {
  id?: string;
  workerCode?: string;
  fullName: string;
  username: string;
  email: string;
  status: "activo" | "inactivo";
  role: RoleId;
  managerId?: string | null;
  costCenterIds?: string[];
  password?: string;
}) {
  const fullName = input.fullName.trim();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  if (!fullName || !username || !email) throw new Error("Nombre, usuario y correo son obligatorios.");

  const dupUser = db
    .prepare("SELECT id FROM users WHERE lower(username) = ? AND id != ?")
    .get(username.toLowerCase(), input.id ?? "") as { id: string } | undefined;
  if (dupUser) throw new Error("Ya existe un usuario con ese nombre de cuenta.");
  const dupEmail = db
    .prepare("SELECT id FROM users WHERE lower(email) = ? AND id != ?")
    .get(email, input.id ?? "") as { id: string } | undefined;
  if (dupEmail) throw new Error("Ya existe un usuario con ese correo corporativo.");

  const managerId = input.role === "kam" ? resolveUserRef(input.managerId) : null;
  if (input.role === "kam" && !managerId) throw new Error("Un KAM debe tener un gerente responsable.");
  const stamp = nowIso();
  const id = input.id ?? newId("u");

  if (input.id) {
    db.prepare(
      `UPDATE users SET worker_code = ?, full_name = ?, username = ?, email = ?, status = ?, manager_id = ?, updated_at = ?
       WHERE id = ?`,
    ).run(input.workerCode?.trim() || null, fullName, username, email, input.status, managerId, stamp, id);
    if (input.password) {
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await bcrypt.hash(input.password, 12), id);
    }
  } else {
    const password = input.password;
    if (!password) throw new Error("La contraseña es obligatoria para un usuario nuevo.");
    db.prepare(
      `INSERT INTO users (id, worker_code, full_name, username, email, password_hash, status, manager_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.workerCode?.trim() || null,
      fullName,
      username,
      email,
      await bcrypt.hash(password, 12),
      input.status,
      managerId,
      stamp,
      stamp,
    );
  }

  db.prepare("DELETE FROM user_roles WHERE user_id = ?").run(id);
  db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)").run(id, input.role);
  db.prepare("DELETE FROM user_cost_centers WHERE user_id = ?").run(id);
  for (const cc of input.costCenterIds ?? []) {
    db.prepare("INSERT OR IGNORE INTO user_cost_centers (user_id, cost_center_id) VALUES (?, ?)").run(id, cc);
  }
  const saved = findById(id);
  if (!saved) throw new Error("No se pudo guardar el usuario.");
  return toPublic(saved);
}

export function setUserStatus(id: string, status: "activo" | "inactivo") {
  const current = findById(id);
  if (!current) throw new Error("Usuario no encontrado.");
  db.prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), id);
  return toPublic(findById(id)!);
}

export async function verifyPassword(user: UserAuthRow, password: string) {
  return bcrypt.compare(password, user.password_hash);
}
