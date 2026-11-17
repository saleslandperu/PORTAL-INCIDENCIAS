import bcrypt from "bcryptjs";
import { serverConfig } from "./config.ts";
import { db, nowIso } from "./db.ts";

const demoCenters = [
  ["CC-110", "Administración", "Gestión administrativa corporativa"],
  ["CC-120", "Finanzas", "Contabilidad y tesorería"],
  ["CC-210", "Operaciones Norte", "Operación de la zona norte"],
  ["CC-220", "Operaciones Sur", "Operación de la zona sur"],
  ["CC-310", "Logística", "Almacén, patio y despacho"],
  ["CC-410", "Comercial", "Fuerza comercial y cotizaciones"],
  ["CC-510", "Recursos Humanos", "Personas y onboarding"],
] as const;

const demoUsers = [
  ["u-admin", "Laura Méndez", "admin.ti", "laura.mendez@empresa-demo.local", "admin_ti", null],
  ["u-ger-n", "Ricardo Beltrán", "gerente.norte", "ricardo.beltran@empresa-demo.local", "gerente", null],
  ["u-ger-s", "Carmen Ibarra", "gerente.sur", "carmen.ibarra@empresa-demo.local", "gerente", null],
  ["u-kam-on", "Héctor Salazar", "kam.norte", "hector.salazar@empresa-demo.local", "kam", "u-ger-n"],
  ["u-kam-os", "Andrés Molina", "kam.sur", "andres.molina@empresa-demo.local", "kam", "u-ger-s"],
  ["u-kam-com", "Rosa Méndez", "kam.comercial", "rosa.mendez@empresa-demo.local", "kam", "u-ger-n"],
  ["u-kam-af", "Elena Navarro", "kam.adminfin", "elena.navarro@empresa-demo.local", "kam", "u-ger-s"],
  ["u-kam-rh", "Lucía Andrade", "kam.rrhh", "lucia.andrade@empresa-demo.local", "kam", "u-ger-s"],
  ["u-tec", "Marcos Vidal", "tecnico.mesa", "marcos.vidal@empresa-demo.local", "tecnico_ti", null],
  ["u-consulta", "Ana Quiroz", "consulta.ti", "ana.quiroz@empresa-demo.local", "consulta", null],
] as const;

const demoAssignments: Array<[string, string]> = [
  ["u-kam-af", "CC-110"],
  ["u-kam-af", "CC-120"],
  ["u-kam-on", "CC-210"],
  ["u-kam-on", "CC-310"],
  ["u-kam-os", "CC-220"],
  ["u-kam-com", "CC-410"],
  ["u-kam-rh", "CC-510"],
];

/** Solo desarrollo. La clave sale de PORTAL_BOOTSTRAP_PASSWORD, no del código. */
export async function seedDemoIfAllowed() {
  if (!serverConfig.allowDemoUserSeed || !serverConfig.bootstrapPassword) return;
  const stamp = nowIso();
  const hash = await bcrypt.hash(serverConfig.bootstrapPassword, 12);
  const ids = new Map<string, string>();

  const insertCc = db.prepare(
    `INSERT OR IGNORE INTO cost_centers (id, code, name, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'activo', ?, ?)`,
  );
  for (const [id, name, description] of demoCenters) {
    insertCc.run(id, id, name, description, stamp, stamp);
  }

  for (const [plannedId, fullName, username, email, role, managerRef] of demoUsers) {
    const existing = db.prepare("SELECT id FROM users WHERE lower(username) = ?").get(username) as { id: string } | undefined;
    let id = existing?.id;
    if (!id) {
      const managerId = managerRef ? ids.get(managerRef) ?? null : null;
      db.prepare(
        `INSERT INTO users (id, worker_code, full_name, username, email, password_hash, status, manager_id, created_at, updated_at)
         VALUES (?, NULL, ?, ?, ?, ?, 'activo', ?, ?, ?)`,
      ).run(plannedId, fullName, username, email, hash, managerId, stamp, stamp);
      id = plannedId;
    }
    ids.set(plannedId, id);
    db.prepare("INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)").run(id, role);
  }

  const insertAssign = db.prepare("INSERT OR IGNORE INTO user_cost_centers (user_id, cost_center_id) VALUES (?, ?)");
  for (const [userRef, costCenterId] of demoAssignments) {
    const userId = ids.get(userRef);
    if (userId) insertAssign.run(userId, costCenterId);
  }
}
