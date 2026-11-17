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
import { downloadCsv, incidentsToCsv } from "../utils/csv";

const emptyFilters: IncidentFilters = {};

export function ReportsPage() {
  const { scope } = useAuth();
  const [filters, setFilters] = useState<IncidentFilters>(emptyFilters);
  const [selected, setSelected] = useState<Incident | null>(null);
  const catalogs = useScopedCatalogs(filters);
  const feed = useIncidentFeed();
  const rows = useMemo(() => (scope ? incidentService.search(scope, filters) : []), [feed, filters, scope]);

  const exportCsv = () => {
    const csv = incidentsToCsv(rows);
    downloadCsv("reporte-incidencias-ti.csv", csv);
  };

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
      <div className="card" style={{ padding: 16, marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <strong>{rows.length}</strong> incidencias coinciden con el criterio del reporte, dentro de su ámbito.
        </div>
        <button type="button" className="btn btn-gold" onClick={exportCsv} disabled={rows.length === 0}>
          Exportar a CSV
        </button>
      </div>
      <div className="card">
        <IncidentTable rows={rows} onSelect={setSelected} />
      </div>
      <IncidentDrawer incident={selected} onClose={() => setSelected(null)} />
    </>
  );
}
