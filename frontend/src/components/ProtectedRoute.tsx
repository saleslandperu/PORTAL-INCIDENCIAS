import { Navigate, Outlet } from "react-router-dom";
import { homePath } from "../config/permissions";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, ready } = useAuth();
  if (!ready) return <p className="notice">Verificando sesión…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function PermissionRoute({ permission }: { permission: string }) {
  const { user, scope } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const allowed =
    scope?.permissionIds.includes(permission) || (permission === "profiles.manage" && Boolean(scope?.canManageProfiles));
  if (!allowed) {
    const dest = homePath(scope?.permissionIds);
    if (permission === "nav.dashboard" && dest === "/") {
      return <p className="notice">No tiene permisos de consulta en este portal.</p>;
    }
    return <Navigate to={dest} replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { user, ready, scope } = useAuth();
  if (!ready) return <p className="notice">Verificando sesión…</p>;
  if (user) return <Navigate to={homePath(scope?.permissionIds)} replace />;
  return <Outlet />;
}
