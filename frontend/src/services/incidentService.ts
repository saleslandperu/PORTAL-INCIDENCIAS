import { incidents as demoIncidents } from "../data/incidents";
import type {
  ChartSlice,
  DashboardKpis,
  Incident,
  IncidentFilters,
} from "../types/incident";
import type { AccessScope } from "../types/organization";
import {
  elapsedMs,
  formatElapsed,
  isClosedStatus,
  isOverdue,
  monthKey,
  monthLabel,
  parseDate,
} from "../utils/dates";
import { constrainFilters, costCentersForKam } from "./accessService";
import { api, ApiError } from "./api";
import { organizationStore } from "./organizationStore";

type IncidentSource = "demo" | "glpi" | "unconfigured";

interface IncidentSnapshot {
  source: IncidentSource;
  note: string;
  incidents: Incident[];
  revision: number;
}

const listeners = new Set<() => void>();
let revision = 0;
let cached: IncidentSnapshot = {
  source: "demo",
  note: "Datos de demostración. No son tickets reales de GLPI.",
  incidents: demoIncidents.map((item) => ({ ...item, dataSource: "demo" })),
  revision,
};

function emit(next: Omit<IncidentSnapshot, "revision">) {
  revision += 1;
  cached = { ...next, revision };
  listeners.forEach((listener) => listener());
}

function inScope(incident: Incident, scope: AccessScope): boolean {
  if (incident.dataSource === "glpi" || incident.costCenterAssignmentStatus === "pending_link") {
    return true;
  }
  if (scope.seesAllIncidents) return true;
  return scope.costCenterIds.includes(incident.costCenterId);
}

function matchesFilters(incident: Incident, filters: IncidentFilters, scope: AccessScope): boolean {
  if (!inScope(incident, scope)) return false;

  // El filtro por KAM/centro se aplica cuando la incidencia tiene centro de costo relacionado.
  // Las que quedan "pendientes de relación" (sin centro) no se excluyen por estos filtros salvo que
  // el usuario filtre por un centro concreto (abajo), en cuyo caso no coinciden y se van.
  if (filters.kamId) {
    const allowed = costCentersForKam(filters.kamId, organizationStore.getSnapshot());
    if (!allowed.includes(incident.costCenterId)) return false;
  }

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const haystack = [
      incident.ticketNumber,
      incident.requester,
      incident.costCenterName,
      incident.category,
      incident.description,
      incident.tiOwner,
      incident.status,
      incident.priority,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  if (filters.costCenterId && incident.costCenterId !== filters.costCenterId) return false;
  if (filters.status && incident.status !== filters.status) return false;
  if (filters.priority && incident.priority !== filters.priority) return false;

  const registered = parseDate(incident.registeredAt);
  if (filters.dateFrom) {
    const from = new Date(`${filters.dateFrom}T00:00:00`);
    if (registered < from) return false;
  }
  if (filters.dateTo) {
    const to = new Date(`${filters.dateTo}T23:59:59`);
    if (registered > to) return false;
  }

  return true;
}

function sortByDateDesc(a: Incident, b: Incident): number {
  return parseDate(b.registeredAt).getTime() - parseDate(a.registeredAt).getTime();
}

function countBy(items: Incident[], pick: (item: Incident) => string): ChartSlice[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = pick(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

function safeFilters(filters: IncidentFilters, scope: AccessScope) {
  return constrainFilters(filters, scope);
}

export const incidentService = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): IncidentSnapshot {
    return cached;
  },

  useDemo() {
    emit({
      source: "demo",
      note: "Datos de demostración. No son tickets reales de GLPI.",
      incidents: demoIncidents.map((item) => ({ ...item, dataSource: "demo" })),
    });
  },

  async refreshFromApi() {
    try {
      const payload = await api<{ incidents: Incident[]; note?: string; source?: string }>("/api/incidents");
      emit({
        source: "glpi",
        note: payload.note ?? "Tickets reales de GLPI. Centro de costo pendiente de relación.",
        incidents: payload.incidents.map((item) => ({ ...item, dataSource: "glpi" })),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        emit({
          source: "unconfigured",
          note: "No tiene permiso para consultar incidencias.",
          incidents: [],
        });
        return;
      }
      if (error instanceof ApiError && (error.code === "GLPI_NOT_CONFIGURED" || error.status === 503)) {
        emit({
          source: "unconfigured",
          note: "GLPI no está configurado en el servidor. Se muestran datos de demostración.",
          incidents: demoIncidents.map((item) => ({ ...item, dataSource: "demo" })),
        });
        return;
      }
      emit({
        source: "unconfigured",
        note: error instanceof Error ? error.message : "No fue posible consultar GLPI. Se muestran datos de demostración.",
        incidents: demoIncidents.map((item) => ({ ...item, dataSource: "demo" })),
      });
    }
  },

  search(scope: AccessScope, filters: IncidentFilters = {}): Incident[] {
    const constrained = safeFilters(filters, scope);
    return cached.incidents.filter((item) => matchesFilters(item, constrained, scope)).sort(sortByDateDesc);
  },

  getById(scope: AccessScope, id: string): Incident | undefined {
    const incident = cached.incidents.find((item) => item.id === id);
    if (!incident || !inScope(incident, scope)) return undefined;
    return incident;
  },

  getKpis(scope: AccessScope, filters: IncidentFilters = {}): DashboardKpis {
    const rows = this.search(scope, filters);
    return {
      total: rows.length,
      open: rows.filter((item) => item.status === "Abierta").length,
      pending: rows.filter((item) => item.status === "Pendiente").length,
      resolved: rows.filter((item) => isClosedStatus(item.status)).length,
      overdue: rows.filter((item) => isOverdue(item)).length,
    };
  },

  getStatusChart(scope: AccessScope, filters: IncidentFilters = {}): ChartSlice[] {
    return countBy(this.search(scope, filters), (item) => item.status);
  },

  getPriorityChart(scope: AccessScope, filters: IncidentFilters = {}): ChartSlice[] {
    const order = ["Crítica", "Alta", "Media", "Baja"];
    return countBy(this.search(scope, filters), (item) => item.priority).sort(
      (a, b) => order.indexOf(a.name) - order.indexOf(b.name),
    );
  },

  getCategoryChart(scope: AccessScope, filters: IncidentFilters = {}): ChartSlice[] {
    return countBy(this.search(scope, filters), (item) => item.category).sort((a, b) => b.value - a.value);
  },

  getMonthlyTrend(scope: AccessScope, filters: IncidentFilters = {}): ChartSlice[] {
    const rows = this.search(scope, filters);
    const map = new Map<string, number>();
    rows.forEach((item) => {
      const key = monthKey(item.registeredAt);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ name: monthLabel(key), value }));
  },

  withElapsed(incident: Incident) {
    return {
      ...incident,
      elapsedLabel: formatElapsed(elapsedMs(incident)),
      overdue: isOverdue(incident),
    };
  },
};
