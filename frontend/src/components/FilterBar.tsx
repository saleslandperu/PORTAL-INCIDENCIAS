import { priorities, statuses } from "../data/catalogs";
import type { CostCenter, IncidentFilters } from "../types/incident";
import type { AppUser } from "../types/organization";
import { CostCenterCombobox } from "./CostCenterCombobox";

interface FilterBarProps {
  filters: IncidentFilters;
  onChange: (filters: IncidentFilters) => void;
  onClear: () => void;
  costCenters: CostCenter[];
  kams?: AppUser[];
  showSearch?: boolean;
  showKamFilter?: boolean;
}

export function FilterBar({
  filters,
  onChange,
  onClear,
  costCenters,
  kams = [],
  showSearch = true,
  showKamFilter = false,
}: FilterBarProps) {
  const update = (patch: Partial<IncidentFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="card filters">
      {showSearch ? (
        <label>
          Búsqueda
          <input
            value={filters.search ?? ""}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Ticket, solicitante, descripción..."
          />
        </label>
      ) : null}
      {showKamFilter ? (
        <label>
          KAM
          <select value={filters.kamId ?? ""} onChange={(event) => update({ kamId: event.target.value, costCenterId: "" })}>
            <option value="">Todos</option>
            {kams.map((kam) => (
              <option key={kam.id} value={kam.id}>
                {kam.fullName}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <CostCenterCombobox
        costCenters={costCenters}
        value={filters.costCenterId ?? ""}
        onChange={(id) => update({ costCenterId: id })}
      />
      <label>
        Estado
        <select value={filters.status ?? ""} onChange={(event) => update({ status: event.target.value as IncidentFilters["status"] })}>
          <option value="">Todos</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label>
        Prioridad
        <select
          value={filters.priority ?? ""}
          onChange={(event) => update({ priority: event.target.value as IncidentFilters["priority"] })}
        >
          <option value="">Todas</option>
          {priorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </label>
      <label>
        Desde
        <input type="date" value={filters.dateFrom ?? ""} onChange={(event) => update({ dateFrom: event.target.value })} />
      </label>
      <label>
        Hasta
        <input type="date" value={filters.dateTo ?? ""} onChange={(event) => update({ dateTo: event.target.value })} />
      </label>
      <button type="button" className="btn btn-secondary" onClick={onClear}>
        Limpiar
      </button>
    </div>
  );
}
