import type { IncidentCategory, IncidentPriority, IncidentStatus } from "../types/incident";

export const statuses: IncidentStatus[] = [
  "Abierta",
  "Pendiente",
  "En proceso",
  "Resuelta",
  "Cerrada",
];

export const priorities: IncidentPriority[] = ["Baja", "Media", "Alta", "Crítica"];

export const categories: IncidentCategory[] = [
  "Hardware",
  "Software",
  "Red",
  "Accesos",
  "Correo",
  "Impresoras",
  "Telefonía",
  "Copias de seguridad",
];
