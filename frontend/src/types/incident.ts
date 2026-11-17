export type IncidentStatus =
  | "Abierta"
  | "Pendiente"
  | "En proceso"
  | "Resuelta"
  | "Cerrada";

export type IncidentPriority = "Baja" | "Media" | "Alta" | "Crítica";

export type IncidentCategory = string;

export interface CostCenter {
  id: string;
  name: string;
  code?: string;
}

export interface Incident {
  id: string;
  ticketNumber: string;
  registeredAt: string;
  resolvedAt?: string;
  requester: string;
  costCenterId: string;
  costCenterName: string;
  costCenterAssignmentStatus?: "pending_link" | "assigned";
  category: IncidentCategory;
  description: string;
  detail: string;
  tiOwner: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  comments: string[];
  dataSource?: "demo" | "glpi";
  unavailableFields?: string[];
}

export interface IncidentFilters {
  search?: string;
  costCenterId?: string;
  kamId?: string;
  status?: IncidentStatus | "";
  priority?: IncidentPriority | "";
  dateFrom?: string;
  dateTo?: string;
}

export interface DashboardKpis {
  total: number;
  open: number;
  pending: number;
  resolved: number;
  overdue: number;
}

export interface ChartSlice {
  name: string;
  value: number;
}

