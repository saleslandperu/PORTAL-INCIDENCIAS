import assert from "node:assert/strict";
import test from "node:test";
import { ALL_PERMISSION_IDS, effectivePermissions, sanitizeGrants } from "./permissionCatalog.ts";

test("Administrador TI conserva todos los permisos aunque el almacenamiento esté vacío", () => {
  const granted = effectivePermissions(["admin_ti"], { admin_ti: [] });
  assert.equal(granted.size, ALL_PERMISSION_IDS.length);
  assert.ok(granted.has("profiles.manage"));
});

test("no se concede gestión de perfiles a un rol que no es Administrador TI", () => {
  const granted = effectivePermissions(["gerente"], {
    gerente: ["nav.dashboard", "profiles.manage"],
  });
  assert.equal(granted.has("nav.dashboard"), true);
  assert.equal(granted.has("profiles.manage"), false);
});

test("sanitizeGrants ignora profiles.manage fuera de admin_ti y fuerza el catálogo completo al administrador", () => {
  assert.deepEqual(sanitizeGrants("kam", ["nav.dashboard", "profiles.manage"]), ["nav.dashboard"]);
  assert.equal(sanitizeGrants("admin_ti", []).length, ALL_PERMISSION_IDS.length);
});

test("Gerencia y consulta no administran usuarios por defecto", () => {
  const gerente = effectivePermissions(["gerente"], {});
  const consulta = effectivePermissions(["consulta"], {});
  const tecnico = effectivePermissions(["tecnico_ti"], {});
  assert.equal(gerente.has("nav.reports"), true);
  assert.equal(gerente.has("users.view"), false);
  assert.equal(consulta.has("cost_centers.manage"), false);
  assert.equal(tecnico.has("users.create"), false);
  assert.equal(tecnico.has("incidents.view"), true);
});
