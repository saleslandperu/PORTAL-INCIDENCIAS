export type IncidentStatus = "Abierta" | "Pendiente" | "En proceso" | "Resuelta" | "Cerrada";
export type IncidentPriority = "Baja" | "Media" | "Alta" | "Crítica";

export interface PortalIncident {
  id: string;
  ticketNumber: string;
  registeredAt: string;
  resolvedAt?: string;
  requester: string;
  costCenterId: string;
  costCenterName: string;
  costCenterAssignmentStatus: "pending_link" | "assigned";
  category: string;
  categoryLabel?: string;
  description: string;
  detail: string;
  tiOwner: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  comments: string[];
  dataSource: "glpi";
  unavailableFields: string[];
}
