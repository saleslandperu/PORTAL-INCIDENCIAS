import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { GuestRoute, PermissionRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { CostCentersPage } from "./pages/CostCentersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { IncidentsPage } from "./pages/IncidentsPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilesPage } from "./pages/ProfilesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route element={<PermissionRoute permission="nav.dashboard" />}>
                <Route path="/" element={<DashboardPage />} />
              </Route>
              <Route element={<PermissionRoute permission="nav.incidents" />}>
                <Route path="/incidencias" element={<IncidentsPage />} />
              </Route>
              <Route element={<PermissionRoute permission="nav.reports" />}>
                <Route path="/reportes" element={<ReportsPage />} />
              </Route>
              <Route element={<PermissionRoute permission="nav.settings" />}>
                <Route path="/configuracion" element={<SettingsPage />} />
              </Route>
              <Route element={<PermissionRoute permission="users.view" />}>
                <Route path="/usuarios" element={<UsersPage />} />
              </Route>
              <Route element={<PermissionRoute permission="cost_centers.manage" />}>
                <Route path="/centros-de-costo" element={<CostCentersPage />} />
              </Route>
              <Route element={<PermissionRoute permission="profiles.manage" />}>
                <Route path="/perfiles-y-permisos" element={<ProfilesPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
