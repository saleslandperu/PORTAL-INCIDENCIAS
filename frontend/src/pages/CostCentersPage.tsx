import { FormEvent, useMemo, useState } from "react";
import { Pagination } from "../components/Pagination";
import { useAuth, useOrganization } from "../context/AuthContext";
import { patchCostCenterStatus, saveCostCenter } from "../services/orgApi";
import { organizationStore } from "../services/organizationStore";
import type { CostCenterRecord, RecordStatus } from "../types/organization";

const PAGE_SIZE = 8;

interface CenterForm {
  id?: string;
  code: string;
  name: string;
  description: string;
  status: RecordStatus;
  kamIds: string[];
}

const emptyForm: CenterForm = {
  code: "",
  name: "",
  description: "",
  status: "activo",
  kamIds: [],
};

export function CostCentersPage() {
  const { scope, sessionSource } = useAuth();
  const snapshot = useOrganization();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<CenterForm | null>(null);
  const [error, setError] = useState("");

  const kams = snapshot.users.filter((item) => item.role === "kam");
  const rows = useMemo(() => {
    return snapshot.costCenters.filter((item) => {
      const haystack = `${item.code} ${item.name} ${item.description}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [search, snapshot.costCenters, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kamsOf = (centerId: string) =>
    snapshot.assignments
      .filter((item) => item.costCenterId === centerId)
      .map((item) => kams.find((kam) => kam.id === item.kamId)?.fullName)
      .filter(Boolean)
      .join(", ") || "Sin asignar";

  const openEdit = (center: CostCenterRecord) => {
    setError("");
    setForm({
      id: center.id,
      code: center.code,
      name: center.name,
      description: center.description,
      status: center.status,
      kamIds: snapshot.assignments.filter((item) => item.costCenterId === center.id).map((item) => item.kamId),
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form || !scope?.canManageCostCenters) return;
    try {
      if (sessionSource === "backend") {
        await saveCostCenter({
          id: form.id,
          code: form.code,
          name: form.name,
          description: form.description,
          status: form.status,
          kamIds: form.kamIds,
        });
      } else {
        organizationStore.upsertCostCenter(
          {
            id: form.id,
            code: form.code,
            name: form.name,
            description: form.description,
            status: form.status,
          },
          form.kamIds,
        );
      }
      setForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el centro de costo.");
    }
  };

  const toggleStatus = async (center: CostCenterRecord) => {
    const status = center.status === "activo" ? "inactivo" : "activo";
    try {
      if (sessionSource === "backend") await patchCostCenterStatus(center.id, status);
      else organizationStore.setCostCenterStatus(center.id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado.");
    }
  };

  if (!scope?.canManageCostCenters) {
    return <p className="notice">No tiene permiso para administrar centros de costo.</p>;
  }

  return (
    <>
      <p className="muted">
        Un mismo centro de costo puede asignarse a más de un KAM, sin duplicar el código.
      </p>
      <div className="card filters">
        <label>
          Búsqueda
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Código o nombre" />
        </label>
        <label>
          Estado
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
        <button type="button" className="btn btn-primary" onClick={() => { setError(""); setForm({ ...emptyForm }); }}>
          Nuevo centro de costo
        </button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>KAM asignados</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {current.map((center) => (
                <tr key={center.id}>
                  <td className="ticket">{center.code}</td>
                  <td>{center.name}</td>
                  <td>{center.description}</td>
                  <td>
                    <span className={`chip ${center.status === "activo" ? "Resuelta" : "Cerrada"}`}>{center.status}</span>
                  </td>
                  <td>{kamsOf(center.id)}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => openEdit(center)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => void toggleStatus(center)}
                      >
                        {center.status === "activo" ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} onPage={setPage} />
      </div>

      {form ? (
        <div className="overlay" onClick={() => setForm(null)} role="presentation">
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>{form.id ? "Editar centro de costo" : "Nuevo centro de costo"}</h3>
              <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
                Cerrar
              </button>
            </header>
            {error ? <div className="form-error">{error}</div> : null}
            <form className="stack-form" onSubmit={submit}>
              <label>
                Código
                <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                Nombre
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>
                Descripción
                <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>
              <label>
                Estado
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as RecordStatus })}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </label>
              <fieldset className="check-grid">
                <legend>KAM asignados</legend>
                {kams.map((kam) => (
                  <label key={kam.id} className="check-row">
                    <input
                      type="checkbox"
                      checked={form.kamIds.includes(kam.id)}
                      onChange={() => {
                        const exists = form.kamIds.includes(kam.id);
                        setForm({
                          ...form,
                          kamIds: exists ? form.kamIds.filter((id) => id !== kam.id) : [...form.kamIds, kam.id],
                        });
                      }}
                    />
                    {kam.fullName}
                  </label>
                ))}
              </fieldset>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
