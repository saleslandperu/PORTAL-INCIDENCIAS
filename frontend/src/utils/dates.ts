import type { Incident, IncidentPriority } from "../types/incident";

const SLA_HOURS: Record<IncidentPriority, number> = {
  Crítica: 4,
  Alta: 24,
  Media: 72,
  Baja: 168,
};

export function parseDate(value: string): Date {
  return new Date(value);
}

export function formatDate(value: string): string {
  return parseDate(value).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(value: string): string {
  return parseDate(value).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toInputDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isClosedStatus(status: Incident["status"]): boolean {
  return status === "Resuelta" || status === "Cerrada";
}

export function elapsedMs(incident: Incident, now = new Date()): number {
  const start = parseDate(incident.registeredAt).getTime();
  const end = incident.resolvedAt ? parseDate(incident.resolvedAt).getTime() : now.getTime();
  return Math.max(0, end - start);
}

export function formatElapsed(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours < 24) return restMinutes ? `${hours} h ${restMinutes} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days} d ${restHours} h` : `${days} d`;
}

export function isOverdue(incident: Incident, now = new Date()): boolean {
  if (isClosedStatus(incident.status)) return false;
  const limitMs = SLA_HOURS[incident.priority] * 60 * 60 * 1000;
  return now.getTime() - parseDate(incident.registeredAt).getTime() > limitMs;
}

export function monthKey(value: string): string {
  const date = parseDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  const label = date.toLocaleDateString("es-PE", { month: "short", year: "numeric" });
  return label.replace(".", "").replace(/^\w/, (letter) => letter.toUpperCase());
}
