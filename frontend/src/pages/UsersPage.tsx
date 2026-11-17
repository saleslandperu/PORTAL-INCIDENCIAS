import { FormEvent, useMemo, useState } from "react";
import { Pagination } from "../components/Pagination";
import { useAuth, useOrganization } from "../context/AuthContext";
import { patchUserStatus, saveUser } from "../services/orgApi";
import { organizationStore } from "../services/organizationStore";
import type { AppUser, RecordStatus, UserRole } from "../types/organization";
import { roleLabels } from "../types/organization";

const PAGE_SIZE = 8;

interface UserFormState {
  id?: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  status: RecordStatus;
  managerId: string;
  costCenterIds: string[];
  canManageUsers: boolean;
  password: string;
}

function canAssignCostCenters(_role?: UserRole) {
  return true;
}

const emptyForm: UserFormState = {
  fullName: "",
  username: "",
  email: "",
  role: "kam",
  status: "activo",
  managerId: "",
  costCenterIds: [],
  canManageUsers: false,
  password: "",
};

export function UsersPage() {
  const { scope, sessionSource } = useAuth();
  const snapshot = useOrganization();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<UserFormState | null>(null);
  const [view, setView] = useState<AppUser | null>(null);
  const [error, setError] = useState("");

  const gerentes = snapshot.users.filter((item) => item.role === "gerente");
  const rows = useMemo(() => {
    return snapshot.users.filter((item) => {
      const haystack = `${item.fullName} ${item.username} ${item.email} ${roleLabels[item.role]}`.toLowerCase();
      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (roleFilter && item.role !== roleFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [roleFilter, search, snapshot.users, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const assignedCount = (userId: string) =>
    snapshot.assignments.filter((item) => item.kamId === userId).length;

  const managerName = (managerId?: string) =>
    snapshot.users.find((item) => item.id === managerId)?.fullName ?? "—";

  const openCreate = () => {
    setError("");
    setView(null);
    setForm({ ...emptyForm });
  };

  const openEdit = (user: AppUser) => {
    setError("");
    setView(null);
    let costCenterIds = snapshot.assignments
      .filter((item) => item.kamId === user.id)
      .map((item) => item.costCenterId);
    if (user.role === "gerente" && costCenterIds.length === 0) {
      const kamIds = snapshot.users.filter((item) => item.role === "kam" && item.managerId === user.id).map((item) => item.id);
      costCenterIds = [...new Set(
        snapshot.assignments.filter((item) => kamIds.includes(item.kamId)).map((item) => item.costCenterId),
      )];
    }
    setForm({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      managerId: user.managerId ?? "",
      costCenterIds,
      canManageUsers: Boolean(user.permissions?.canManageUsers),
      password: "",
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form || !(form.id ? scope?.canEditUsers : scope?.canCreateUsers)) return;
    try {
      if (sessionSource === "backend") {
        await saveUser({
          id: form.id,
          fullName: form.fullName,
          username: form.username,
          email: form.email,
          role: form.role,
          status: form.status,
          managerId: form.role === "kam" ? form.managerId : undefined,
          costCenterIds: canAssignCostCenters(form.role) ? form.costCenterIds : [],
          password: form.password || undefined,
        });
      } else {
        organizationStore.upsertUser(
          {
            id: form.id,
            fullName: form.fullName,
            username: form.username,
            email: form.email,
            role: form.role,
            status: form.status,
            managerId: form.role === "kam" ? form.managerId : undefined,
            permissions: form.role === "tecnico_ti" ? { canManageUsers: form.canManageUsers } : undefined,
          },
          canAssignCostCenters(form.role) ? form.costCenterIds : [],
        );
      }
      setForm(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el usuario.");
    }
  };

  const toggleStatus = async (user: AppUser) => {
    const status = user.status === "activo" ? "inactivo" : "activo";
    try {
      if (sessionSource === "backend") await patchUserStatus(user.id, status);
      else organizationStore.setUserStatus(user.id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado.");
    }
  };

  if (!scope?.canViewUsers) {
    return <p className="notice">No tiene permiso para ver usuarios.</p>;
  }

  return (
    <>
      <div className="card filters">
        <label>
          Búsqueda
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nombre, usuario o correo" />
        </label>
        <label>
          Rol
          <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}>
            <option value="">Todos</option>
            {Object.entries(roleLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
        {scope.canCreateUsers ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Nuevo usuario
          </button>
        ) : null}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre completo</th>
                <th>Usuario y correo</th>
                <th>Rol</th>
                <th>Gerente responsable</th>
                <th>Estado</th>
                <th>CC asignados</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {current.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>
                    <strong>{user.username}</strong>
                    <div className="muted">{user.email}</div>
                  </td>
                  <td>{roleLabels[user.role]}</td>
                  <td>{user.role === "kam" ? managerName(user.managerId) : "—"}</td>
                  <td>
                    <span className={`chip ${user.status === "activo" ? "Resuelta" : "Cerrada"}`}>{user.status}</span>
                  </td>
                  <td>{canAssignCostCenters(user.role) ? assignedCount(user.id) : "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setView(user)}>
                        Ver
                      </button>
                      {scope.canEditUsers ? (
                      <button type="button" className="btn btn-secondary" onClick={() => openEdit(user)}>
                        Editar
                      </button>
                      ) : null}
                      {scope.canToggleUserStatus ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => void toggleStatus(user)}
                      >
                        {user.status === "activo" ? "Desactivar" : "Activar"}
                      </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} onPage={setPage} />
      </div>

      {view ? (
        <div className="overlay" onClick={() => setView(null)} role="presentation">
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>{view.fullName}</h3>
              <button type="button" className="btn btn-secondary" onClick={() => setView(null)}>
                Cerrar
              </button>
            </header>
            <p>{roleLabels[view.role]} · {view.status}</p>
            <p className="muted">{view.username} · {view.email}</p>
            {view.role === "kam" ? <p>Gerente: {managerName(view.managerId)}</p> : null}
            {canAssignCostCenters(view.role) ? (
              <ul className="list">
                {snapshot.costCenters
                  .filter((center) => snapshot.assignments.some((item) => item.kamId === view.id && item.costCenterId === center.id))
                  .map((center) => (
                    <li key={center.id}>
                      {center.code} {center.name}
                    </li>
                  ))}
              </ul>
            ) : null}
          </aside>
        </div>
      ) : null}

      {form ? (
        <div className="overlay" onClick={() => setForm(null)} role="presentation">
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>{form.id ? "Editar usuario" : "Nuevo usuario"}</h3>
              <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
                Cerrar
              </button>
            </header>
            {error ? <div className="form-error">{error}</div> : null}
            <form className="stack-form" onSubmit={submit}>
              <label>
                Nombre completo
                <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
              </label>
              <label>
                Usuario
                <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
              </label>
              <label>
                Correo corporativo
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>
                Rol
                <select
                  value={form.role}
                  onChange={(event) => {
                    const role = event.target.value as UserRole;
                    setForm({
                      ...form,
                      role,
                      managerId: role === "kam" ? form.managerId : "",
                      canManageUsers: role === "tecnico_ti" ? form.canManageUsers : false,
                    });
                  }}
                >
                  {Object.entries(roleLabels).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as RecordStatus })}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </label>
              {form.role === "kam" ? (
                <label>
                  Gerente responsable
                  <select value={form.managerId} onChange={(event) => setForm({ ...form, managerId: event.target.value })}>
                    <option value="">Seleccione</option>
                    {gerentes.map((gerente) => (
                      <option key={gerente.id} value={gerente.id}>
                        {gerente.fullName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {canAssignCostCenters(form.role) ? (
                <fieldset className="check-grid">
                  <legend>Centros de costo asignados</legend>
                  <p className="muted">Marque uno o varios centros. Un administrador sigue viendo el universo completo.</p>
                  {snapshot.costCenters.map((center) => (
                    <label key={center.id} className="check-row">
                      <input
                        type="checkbox"
                        checked={form.costCenterIds.includes(center.id)}
                        onChange={() => {
                          const exists = form.costCenterIds.includes(center.id);
                          setForm({
                            ...form,
                            costCenterIds: exists
                              ? form.costCenterIds.filter((id) => id !== center.id)
                              : [...form.costCenterIds, center.id],
                          });
                        }}
                      />
                      {center.code} {center.name}
                    </label>
                  ))}
                </fieldset>
              ) : null}
              {sessionSource === "backend" ? (
                <label>
                  Contraseña {form.id ? "(opcional al editar)" : ""}
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    autoComplete="new-password"
                  />
                </label>
              ) : null}
              {form.role === "tecnico_ti" && sessionSource !== "backend" ? (
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={form.canManageUsers}
                    onChange={(event) => setForm({ ...form, canManageUsers: event.target.checked })}
                  />
                  Otorgar administración de usuarios (excepción expresa)
                </label>
              ) : null}
              <p className="muted">
                Con sesión de servidor la contraseña se guarda con bcrypt en SQLite. No escriba secretos de GLPI en esta pantalla.
              </p>
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
