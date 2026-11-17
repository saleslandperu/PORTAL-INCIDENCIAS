import { appConfig } from "../config/appConfig";
import { useAuth, useOrganization } from "../context/AuthContext";
import { useIncidentFeed } from "../hooks/useIncidentFeed";
import { roleLabels } from "../types/organization";

export function SettingsPage() {
  const { user, scope, sessionSource } = useAuth();
  const snapshot = useOrganization();
  const feed = useIncidentFeed();
  const visibleCenters = snapshot.costCenters.filter((item) => scope?.costCenterIds.includes(item.id));

  return (
    <div className="config-grid">
      <article className="panel">
        <h3>Sesión y arquitectura</h3>
        <p className="notice">
          Esta aplicación no está lista para producción. Las credenciales de GLPI viven solo en
          server/.env (fuera del repositorio y del navegador).
        </p>
        <ul className="list">
          <li>
            <strong>Usuario:</strong> {user?.fullName} ({user ? roleLabels[user.role] : ""})
          </li>
          <li>
            <strong>Origen de sesión:</strong> {sessionSource === "backend" ? "Servidor" : "Demostración"}
          </li>
          <li>
            <strong>Incidencias:</strong> {feed.note}
          </li>
          <li>
            <strong>GLPI:</strong> {appConfig.integrations.glpi.notes}
          </li>
          <li>
            <strong>Chatbot:</strong> {appConfig.integrations.chatbot.notes}
          </li>
          <li>
            <strong>Autenticación:</strong> {appConfig.integrations.authentication.notes}
          </li>
        </ul>
      </article>
      <article className="panel">
        <h3>Centros de costo en catálogo</h3>
        <ul className="list">
          {visibleCenters.map((center) => (
            <li key={center.id}>
              {center.code} {center.name}
            </li>
          ))}
        </ul>
        <p className="muted">
          El catálogo de CC no se usa para filtrar tickets reales de GLPI hasta validar la relación con el
          maestro de trabajadores.
        </p>
      </article>
    </div>
  );
}
