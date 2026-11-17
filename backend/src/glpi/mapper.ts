import type { IncidentPriority, IncidentStatus, PortalIncident } from "../types/portal.ts";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  const nested = asRecord(value);
  if (nested) {
    if (typeof nested.name === "string" && nested.name.trim()) return nested.name.trim();
    if (typeof nested.completename === "string") return nested.completename.trim();
  }
  return undefined;
}

function firstText(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = text(item[key]);
    if (value) return value;
  }
  return undefined;
}

/** El id de un campo-objeto de GLPI ({id, name}), como texto. GLPI 11 devuelve status, type, etc.
 *  como objetos; mapear por id (estable) es más fiable que por el nombre (traducido). */
function idText(value: unknown): string | undefined {
  const nested = asRecord(value);
  if (nested && (typeof nested.id === "number" || typeof nested.id === "string")) {
    return String(nested.id);
  }
  return undefined;
}

/** Nombre del actor de un ticket con el rol pedido ("requester" | "assigned" | "observer").
 *  GLPI 11 trae los actores en `team`; el `user_recipient` es solo quien REGISTRÓ el ticket (en los
 *  tickets del bot, el propio bot), no quien lo pide. `kind` filtra usuario vs grupo por el href. */
function teamMember(item: Record<string, unknown>, role: string, kind?: "user" | "group") {
  const team = item.team;
  if (!Array.isArray(team)) return undefined;
  for (const member of team) {
    const r = asRecord(member);
    if (!r || r.role !== role) continue;
    const href = typeof r.href === "string" ? r.href : "";
    if (kind === "user" && !href.includes("user.form")) continue;
    if (kind === "group" && !href.includes("group.form")) continue;
    const name = text(r.display_name) ?? text(r.name);
    if (name) return name;
  }
  return undefined;
}

const STATUS_MAP: Record<string, IncidentStatus> = {
  new: "Abierta",
  nuevo: "Abierta",
  "1": "Abierta",
  assigned: "En proceso",
  asignado: "En proceso",
  "2": "En proceso",
  planned: "Pendiente",
  planificado: "Pendiente",
  "3": "Pendiente",
  waiting: "Pendiente",
  pendiente: "Pendiente",
  "4": "Pendiente",
  solved: "Resuelta",
  resuelto: "Resuelta",
  "5": "Resuelta",
  closed: "Cerrada",
  cerrado: "Cerrada",
  "6": "Cerrada",
};

const PRIORITY_MAP: Record<string, IncidentPriority> = {
  "1": "Baja",
  verylow: "Baja",
  "2": "Baja",
  low: "Baja",
  baja: "Baja",
  "3": "Media",
  medium: "Media",
  media: "Media",
  "4": "Alta",
  high: "Alta",
  alta: "Alta",
  "5": "Crítica",
  veryhigh: "Crítica",
  major: "Crítica",
  crítica: "Crítica",
  critica: "Crítica",
};

function mapStatus(raw: string | undefined): IncidentStatus | undefined {
  if (!raw) return undefined;
  const key = raw.toLowerCase();
  return STATUS_MAP[key] ?? STATUS_MAP[raw];
}

function mapPriority(raw: string | undefined): IncidentPriority | undefined {
  if (!raw) return undefined;
  return PRIORITY_MAP[raw.toLowerCase()] ?? PRIORITY_MAP[raw];
}

/**
 * Convierte un ticket GLPI al tipo Incident del portal.
 * No inventa valores: si un campo no viene, se registra como no disponible.
 * El centro de costo no se infiere: queda pendiente de relación.
 */
export function mapGlpiTicket(raw: unknown): PortalIncident {
  const item = asRecord(raw) ?? {};
  const unavailable: string[] = [];
  const id = firstText(item, ["id", "ID"]);
  if (!id) {
    throw new Error("El ticket de GLPI no incluye identificador.");
  }
  const name = firstText(item, ["name", "title"]);
  const content = firstText(item, ["content", "description"]);
  // GLPI 11 (API v2) manda status/type como objetos {id,name}; se mapea por id (1–6), estable.
  const statusRaw = idText(item.status) ?? firstText(item, ["status", "status.name"]);
  const priorityRaw = firstText(item, ["priority", "priority.name"]);
  const created = firstText(item, ["date_creation", "date", "date_mod"]);
  const resolved = firstText(item, ["date_solve", "date_close", "solvedate", "closedate"]);
  // El solicitante y el técnico salen de los actores (`team`), no de user_recipient (= quien registra;
  // en los tickets del bot, el propio bot). Fallback a user_recipient solo si no hay actor solicitante.
  const requester = teamMember(item, "requester", "user") ?? firstText(item, ["user_recipient", "requester"]);
  const assignee = teamMember(item, "assigned", "user") ?? firstText(item, ["assigned", "technician", "assignee"]);
  const category = firstText(item, ["category", "itilcategories_id", "itilcategory"]);

  if (!name) unavailable.push("description");
  if (!created) unavailable.push("registeredAt");
  if (!requester) unavailable.push("requester");
  if (!assignee) unavailable.push("tiOwner");
  if (!category) unavailable.push("category");
  if (!mapStatus(statusRaw)) unavailable.push("status");
  if (!mapPriority(priorityRaw)) unavailable.push("priority");
  if (!resolved) unavailable.push("resolvedAt");
  unavailable.push("costCenter");

  return {
    id: String(id),
    ticketNumber: `GLPI-${id}`,
    registeredAt: created ?? "",
    resolvedAt: resolved,
    requester: requester ?? "No disponible",
    costCenterId: "",
    costCenterName: "Pendiente de relación",
    costCenterAssignmentStatus: "pending_link",
    category: category ?? "No disponible",
    categoryLabel: category,
    description: name ?? "Sin título en GLPI",
    detail: content ?? "No disponible",
    tiOwner: assignee ?? "No disponible",
    priority: mapPriority(priorityRaw) ?? "Media",
    status: mapStatus(statusRaw) ?? "Abierta",
    comments: [],
    dataSource: "glpi",
    unavailableFields: unavailable,
  };
}
