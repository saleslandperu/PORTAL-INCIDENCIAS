import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataSourceBanner } from "../components/DataSourceBanner";
import { FilterBar } from "../components/FilterBar";
import { KpiCard } from "../components/KpiCard";
import { useAuth } from "../context/AuthContext";
import { useIncidentFeed } from "../hooks/useIncidentFeed";
import { useScopedCatalogs } from "../hooks/useScopedIncidents";
import { incidentService } from "../services/incidentService";
import type { IncidentFilters } from "../types/incident";
import { roleLabels } from "../types/organization";

const STATUS_COLORS: Record<string, string> = {
  Abierta: "#0ea5a4",
  Pendiente: "#f59e0b",
  "En proceso": "#8b5cf6",
  Resuelta: "#10b981",
  Cerrada: "#64748b",
};

const PRIORITY_COLORS: Record<string, string> = {
  Crítica: "#e11d48",
  Alta: "#f97316",
  Media: "#f59e0b",
  Baja: "#14b8a6",
};

const emptyFilters: IncidentFilters = {};

export function DashboardPage() {
  const { scope, user } = useAuth();
  const [filters, setFilters] = useState<IncidentFilters>(emptyFilters);
  const catalogs = useScopedCatalogs(filters);
  const feed = useIncidentFeed();

  const kpis = useMemo(() => (scope ? incidentService.getKpis(scope, filters) : null), [feed, filters, scope]);
  const byStatus = useMemo(() => (scope ? incidentService.getStatusChart(scope, filters) : []), [feed, filters, scope]);
  const byPriority = useMemo(() => (scope ? incidentService.getPriorityChart(scope, filters) : []), [feed, filters, scope]);
  const byCategory = useMemo(() => (scope ? incidentService.getCategoryChart(scope, filters) : []), [feed, filters, scope]);
  const monthly = useMemo(() => (scope ? incidentService.getMonthlyTrend(scope, filters) : []), [feed, filters, scope]);

  if (!scope || !user || !kpis) return null;

  return (
    <>
      <DataSourceBanner />
      <p className="scope-banner">
        {`Ámbito de ${roleLabels[user.role]}: ${scope.costCenterIds.length} centros de costo${scope.role === "gerente" ? ` · ${scope.kamIds.length} KAM a cargo` : ""}. La consulta aplica el alcance del usuario, no solo la interfaz.`}
      </p>
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(emptyFilters)}
        showSearch={false}
        costCenters={catalogs.costCenters}
        kams={catalogs.kams}
        showKamFilter={catalogs.showKamFilter}
      />
      <section className="kpi-grid">
        <KpiCard label="Total de incidencias" value={kpis.total} tone="total" />
        <KpiCard label="Incidencias abiertas" value={kpis.open} tone="open" />
        <KpiCard label="Incidencias pendientes" value={kpis.pending} tone="pending" />
        <KpiCard label="Incidencias resueltas" value={kpis.resolved} tone="resolved" />
        <KpiCard label="Incidencias vencidas" value={kpis.overdue} tone="overdue" />
      </section>
      <section className="charts">
        <article className="panel">
          <h3>Incidencias por estado</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                {byStatus.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#0f766e"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>
        <article className="panel">
          <h3>Incidencias por prioridad</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byPriority}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Incidencias" radius={[8, 8, 0, 0]}>
                {byPriority.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? "#0f766e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="panel">
          <h3>Incidencias por categoría</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip />
              <Bar dataKey="value" name="Incidencias" fill="#14b8a6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="panel">
          <h3>Evolución mensual</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" name="Incidencias" stroke="#0f766e" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </section>
    </>
  );
}
