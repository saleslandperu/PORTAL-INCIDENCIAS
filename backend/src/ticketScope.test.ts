import assert from "node:assert/strict";
import test from "node:test";
import { resolveTicketScope, ticketInScope } from "./ticketScope.ts";

const none = { directCostCenterIds: [], managedKamCostCenterIds: [] };

test("Administrador TI y Consulta ven todo, incluidos tickets sin centro de costo", () => {
  for (const role of ["admin_ti", "consulta"]) {
    const scope = resolveTicketScope({ roles: [role], ...none });
    assert.equal(ticketInScope(scope, "2001"), true);
    assert.equal(ticketInScope(scope, ""), true);
  }
});

test("KAM ve solo sus centros de costo y nunca tickets sin centro", () => {
  const scope = resolveTicketScope({ roles: ["kam"], directCostCenterIds: ["2001"], managedKamCostCenterIds: ["1001"] });
  assert.equal(ticketInScope(scope, "2001"), true);
  assert.equal(ticketInScope(scope, "1001"), false);
  assert.equal(ticketInScope(scope, ""), false);
  assert.equal(ticketInScope(scope, null), false);
});

test("KAM sin centros asignados no ve nada", () => {
  const scope = resolveTicketScope({ roles: ["kam"], ...none });
  assert.equal(ticketInScope(scope, "2001"), false);
});

test("Gerente ve sus centros y los de sus KAM, no tickets sin centro", () => {
  const scope = resolveTicketScope({ roles: ["gerente"], directCostCenterIds: ["1001"], managedKamCostCenterIds: ["2001"] });
  assert.equal(ticketInScope(scope, "1001"), true);
  assert.equal(ticketInScope(scope, "2001"), true);
  assert.equal(ticketInScope(scope, "2316"), false);
  assert.equal(ticketInScope(scope, ""), false);
});

test("Técnico TI ve todo sin centros asignados y solo los suyos si los tiene", () => {
  assert.equal(ticketInScope(resolveTicketScope({ roles: ["tecnico_ti"], ...none }), ""), true);
  const scoped = resolveTicketScope({ roles: ["tecnico_ti"], directCostCenterIds: ["2316"], managedKamCostCenterIds: [] });
  assert.equal(ticketInScope(scoped, "2316"), true);
  assert.equal(ticketInScope(scoped, "2001"), false);
  assert.equal(ticketInScope(scoped, ""), false);
});

test("Sin rol conocido no se ve nada (no hereda el alcance total de 'consulta')", () => {
  for (const roles of [[], ["otro"]]) {
    const scope = resolveTicketScope({ roles, directCostCenterIds: ["2001"], managedKamCostCenterIds: [] });
    assert.equal(scope.all, false);
    assert.equal(ticketInScope(scope, "2001"), false);
    assert.equal(ticketInScope(scope, ""), false);
  }
});
