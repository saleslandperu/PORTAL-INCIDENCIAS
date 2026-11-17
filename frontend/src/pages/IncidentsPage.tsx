import { useMemo, useState } from "react";
import { DataSourceBanner } from "../components/DataSourceBanner";
import { FilterBar } from "../components/FilterBar";
import { IncidentDrawer } from "../components/IncidentDrawer";
import { IncidentTable } from "../components/IncidentTable";
import { useAuth } from "../context/AuthContext";
import { useIncidentFeed } from "../hooks/useIncidentFeed";
import { useScopedCatalogs } from "../hooks/useScopedIncidents";
import { incidentService } from "../services/incidentService";
import type { Incident, IncidentFilters } from "../types/incident";

const emptyFilters: IncidentFilters = { search: "" };

export function IncidentsPage() {
  const { scope } = useAuth();
  const [filters, setFilters] = useState<IncidentFilters>(emptyFilters);
  const [selected, setSelected] = useState<Incident | null>(null);
  const catalogs = useScopedCatalogs(filters);
  const feed = useIncidentFeed();
  const rows = useMemo(() => (scope ? incidentService.search(scope, filters) : []), [feed, filters, scope]);

  return (
    <>
      <DataSourceBanner />
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(emptyFilters)}
        costCenters={catalogs.costCenters}
        kams={catalogs.kams}
        showKamFilter={catalogs.showKamFilter}
      />
      <div className="card">
        <IncidentTable rows={rows} onSelect={setSelected} />
      </div>
      <IncidentDrawer incident={selected} onClose={() => setSelected(null)} />
    </>
  );
}
