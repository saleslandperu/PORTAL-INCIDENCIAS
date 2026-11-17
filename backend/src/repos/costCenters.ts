import { db, nowIso } from "../db.ts";

export interface CostCenterRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: "activo" | "inactivo";
  created_at: string;
  updated_at: string;
}

export function listCostCenters() {
  return db.prepare("SELECT * FROM cost_centers ORDER BY code").all() as unknown as CostCenterRow[];
}

export function upsertCostCenter(input: {
  id?: string;
  code: string;
  name: string;
  description?: string;
  status: "activo" | "inactivo";
  kamIds?: string[];
}) {
  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  if (!code || !name) throw new Error("El código y el nombre son obligatorios.");
  const dup = db
    .prepare("SELECT id FROM cost_centers WHERE lower(code) = ? AND id != ?")
    .get(code.toLowerCase(), input.id ?? "") as { id: string } | undefined;
  if (dup) throw new Error("Ya existe un centro de costo con ese código.");
  const stamp = nowIso();
  const id = input.id ?? code;
  const existing = db.prepare("SELECT id FROM cost_centers WHERE id = ?").get(id);
  if (existing) {
    db.prepare(
      "UPDATE cost_centers SET code = ?, name = ?, description = ?, status = ?, updated_at = ? WHERE id = ?",
    ).run(code, name, input.description?.trim() || null, input.status, stamp, id);
  } else {
    db.prepare(
      `INSERT INTO cost_centers (id, code, name, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, code, name, input.description?.trim() || null, input.status, stamp, stamp);
  }
  if (input.kamIds) {
    db.prepare("DELETE FROM user_cost_centers WHERE cost_center_id = ?").run(id);
    for (const userId of input.kamIds) {
      db.prepare("INSERT OR IGNORE INTO user_cost_centers (user_id, cost_center_id) VALUES (?, ?)").run(userId, id);
    }
  }
  return db.prepare("SELECT * FROM cost_centers WHERE id = ?").get(id) as unknown as CostCenterRow;
}

export function setCostCenterStatus(id: string, status: "activo" | "inactivo") {
  const current = db.prepare("SELECT id FROM cost_centers WHERE id = ?").get(id);
  if (!current) throw new Error("Centro de costo no encontrado.");
  db.prepare("UPDATE cost_centers SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), id);
  return db.prepare("SELECT * FROM cost_centers WHERE id = ?").get(id) as unknown as CostCenterRow;
}

export function assigneesOf(costCenterId: string) {
  return db
    .prepare("SELECT user_id FROM user_cost_centers WHERE cost_center_id = ?")
    .all(costCenterId) as { user_id: string }[];
}
