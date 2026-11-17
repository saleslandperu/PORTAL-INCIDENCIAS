import assert from "node:assert/strict";
import test from "node:test";
import { mapGlpiTicket } from "./mapper.ts";

test("mapea un ticket GLPI sin inventar centro de costo", () => {
  const incident = mapGlpiTicket({
    id: 42,
    name: "VPN caída",
    content: "No hay acceso remoto",
    status: 1,
    priority: 4,
    date_creation: "2026-10-01 10:00:00",
  });
  assert.equal(incident.id, "42");
  assert.equal(incident.ticketNumber, "GLPI-42");
  assert.equal(incident.costCenterAssignmentStatus, "pending_link");
  assert.equal(incident.costCenterName, "Pendiente de relación");
  assert.equal(incident.dataSource, "glpi");
  assert.ok(incident.unavailableFields.includes("costCenter"));
});

test("mapea el formato real de GLPI 11 (status objeto, date_solve, user_recipient)", () => {
  const incident = mapGlpiTicket({
    id: 7,
    name: "Impresora",
    content: "No imprime",
    status: { id: 5, name: "Resuelto" },
    priority: 3,
    date_creation: "2026-02-10T21:49:15+00:00",
    date_solve: "2026-02-11T09:00:00+00:00",
    user_recipient: { id: 8, name: "mcruz" },
    category: { id: 2, name: "Software" },
  });
  assert.equal(incident.status, "Resuelta");
  assert.equal(incident.priority, "Media");
  assert.equal(incident.resolvedAt, "2026-02-11T09:00:00+00:00");
  assert.equal(incident.requester, "mcruz");
  assert.equal(incident.category, "Software");
});

test("el solicitante sale de team.requester, no de user_recipient (bot)", () => {
  const incident = mapGlpiTicket({
    id: 87,
    name: "X",
    status: { id: 1, name: "Nuevos" },
    priority: 3,
    date_creation: "2026-02-10T21:49:15+00:00",
    user_recipient: { id: 12, name: "bot.whatsapp" },
    team: [
      { role: "requester", display_name: "Manuel Cruz", name: "mcruz", id: 8, href: "/front/user.form.php?id=8" },
      { role: "assigned", display_name: "Ortiz Donny", name: "dortiz", id: 10, href: "/front/user.form.php?id=10" },
      { role: "assigned", display_name: "Soporte ADMIN", name: "Soporte ADMIN", id: 1, href: "/front/group.form.php?id=1" },
    ],
  });
  assert.equal(incident.requester, "Manuel Cruz");
  assert.equal(incident.tiOwner, "Ortiz Donny");
});

test("rechaza un elemento sin identificador", () => {
  assert.throws(() => mapGlpiTicket({ name: "sin id" }));
});
