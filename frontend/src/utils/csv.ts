import type { Incident } from "../types/incident";
import { formatDateTime, formatElapsed, elapsedMs, isOverdue } from "./dates";

function escapeCell(value: string): string {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}

export function incidentsToCsv(rows: Incident[]): string {
  const headers = [
    "Número de ticket",
    "Fecha de registro",
    "Solicitante",
    "Centro de costo",
    "Categoría",
    "Descripción",
    "Responsable de TI",
    "Prioridad",
    "Estado",
    "Tiempo transcurrido",
    "Vencida",
  ];

  const lines = rows.map((incident) =>
    [
      incident.ticketNumber,
      formatDateTime(incident.registeredAt),
      incident.requester,
      incident.costCenterName,
      incident.category,
      incident.description,
      incident.tiOwner,
      incident.priority,
      incident.status,
      formatElapsed(elapsedMs(incident)),
      isOverdue(incident) ? "Sí" : "No",
    ]
      .map(escapeCell)
      .join(";"),
  );

  return [headers.map(escapeCell).join(";"), ...lines].join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
