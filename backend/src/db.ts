import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import { serverConfig } from "./config.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../data");
mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, "portal.sqlite");
export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  worker_code TEXT,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('activo', 'inactivo')),
  manager_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS cost_centers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('activo', 'inactivo')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_cost_centers (
  user_id TEXT NOT NULL,
  cost_center_id TEXT NOT NULL,
  PRIMARY KEY (user_id, cost_center_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_identity_map (
  id TEXT PRIMARY KEY,
  glpi_user_id TEXT,
  requester_email TEXT,
  portal_user_id TEXT,
  cost_center_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (portal_user_id) REFERENCES users(id),
  FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
);
`);

const roles = [
  ["admin_ti", "Administrador TI"],
  ["gerente", "Gerencia"],
  ["kam", "KAM / Responsable de cuenta"],
  ["tecnico_ti", "Técnico TI"],
  ["consulta", "Usuario de consulta"],
] as const;

const insertRole = db.prepare("INSERT OR IGNORE INTO roles (id, label) VALUES (?, ?)");
for (const [id, label] of roles) insertRole.run(id, label);

export function nowIso() {
  return new Date().toISOString();
}

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export async function bootstrapAdmin() {
  if (!serverConfig.bootstrapPassword) return;
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(serverConfig.bootstrapUsername) as
    | { id: string }
    | undefined;
  const hash = await bcrypt.hash(serverConfig.bootstrapPassword, 12);
  const stamp = nowIso();
  if (!existing) {
    const id = newId("u");
    db.prepare(
      `INSERT INTO users (id, worker_code, full_name, username, email, password_hash, status, created_at, updated_at)
       VALUES (?, NULL, ?, ?, ?, ?, 'activo', ?, ?)`,
    ).run(id, "Administrador TI", serverConfig.bootstrapUsername, serverConfig.bootstrapEmail, hash, stamp, stamp);
    db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, 'admin_ti')").run(id);
  }
}
