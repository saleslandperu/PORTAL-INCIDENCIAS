import { NavLink, Outlet, useLocation } from "react-router-dom";
import { appConfig } from "../config/appConfig";
import { useAuth } from "../context/AuthContext";
import { roleLabels } from "../types/organization";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Dashboard gerencial",
    subtitle: "Indicadores consolidados de incidencias TI para toma de decisiones.",
  },
  "/incidencias": {
    title: "Gestión de incidencias",
    subtitle: "Consulta, búsqueda y seguimiento de tickets por centro de costo.",
  },
  "/reportes": {
    title: "Reportes",
    subtitle: "Filtre el universo de incidencias y exporte el resultado a CSV.",
  },
  "/usuarios": {
    title: "Administración de usuarios",
    subtitle: "Alta, edición y asignaciones de gerentes, KAM y personal TI.",
  },
  "/centros-de-costo": {
    title: "Centros de costo",
    subtitle: "Catálogo de CC y relación con responsables de cuenta.",
  },
  "/configuracion": {
    title: "Configuración",
    subtitle: "Parámetros de la propuesta y preparación para integraciones futuras.",
  },
  "/perfiles-y-permisos": {
    title: "Perfiles y permisos",
    subtitle: "Defina qué puede hacer cada perfil. Los cambios se guardan en el servidor.",
  },
};

export function Layout() {
  const location = useLocation();
  const current = titles[location.pathname] ?? titles["/"];
  const { user, scope, logout, sessionSource } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">TI</div>
          <div>
            <h1>{appConfig.appShortName}</h1>
            <p>{appConfig.organizationLabel}</p>
          </div>
        </div>
        <nav className="nav">
          {scope?.canViewDashboard ? (
            <NavLink to="/" end>
              Dashboard
            </NavLink>
          ) : null}
          {scope?.canViewIncidentsNav ? <NavLink to="/incidencias">Incidencias</NavLink> : null}
          {scope?.canViewReports ? <NavLink to="/reportes">Reportes</NavLink> : null}
          {scope?.canViewUsers ? <NavLink to="/usuarios">Usuarios</NavLink> : null}
          {scope?.canManageCostCenters ? <NavLink to="/centros-de-costo">Centros de costo</NavLink> : null}
          {scope?.canManageProfiles ? <NavLink to="/perfiles-y-permisos">Perfiles y permisos</NavLink> : null}
          {scope?.canViewSettings ? <NavLink to="/configuracion">Configuración</NavLink> : null}
        </nav>
        <div className="sidebar-foot">
          <div>
            {user?.fullName}
            <div>{user ? roleLabels[user.role] : ""}</div>
          </div>
          <button type="button" className="btn btn-secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <section className="main">
        <header className="topbar">
          <div>
            <h2>{current.title}</h2>
            <p>{current.subtitle}</p>
          </div>
          <span className="badge">
            {sessionSource === "backend"
              ? "Sesión de servidor · no listo para producción"
              : "Propuesta de mejora · autenticación de demostración"}
          </span>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
