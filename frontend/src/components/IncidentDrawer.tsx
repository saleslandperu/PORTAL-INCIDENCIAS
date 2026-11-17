import type { Incident } from "../types/incident";
import { incidentService } from "../services/incidentService";
import { formatDateTime } from "../utils/dates";
import { PriorityChip, StatusChip } from "./StatusChip";

interface IncidentDrawerProps {
  incident: Incident | null;
  onClose: () => void;
}

export function IncidentDrawer({ incident, onClose }: IncidentDrawerProps) {
  if (!incident) return null;
  const extra = incidentService.withElapsed(incident);

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <aside className="drawer" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Detalle de incidencia">
        <header>
          <div>
            <p className="muted">Detalle de incidencia</p>
            <h3>{incident.ticketNumber}</h3>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <p>{incident.description}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatusChip value={incident.status} />
          <PriorityChip value={incident.priority} />
          {extra.overdue ? <span className="chip overdue">Fuera de plazo</span> : null}
        </div>
        <div className="meta-grid">
          <div className="meta-box">
            <span>Fecha de registro</span>
            <strong>{formatDateTime(incident.registeredAt)}</strong>
          </div>
          <div className="meta-box">
            <span>Tiempo transcurrido</span>
            <strong>{extra.elapsedLabel}</strong>
          </div>
          <div className="meta-box">
            <span>Solicitante</span>
            <strong>{incident.requester}</strong>
          </div>
          <div className="meta-box">
            <span>Centro de costo</span>
            <strong>
              {incident.costCenterAssignmentStatus === "pending_link"
                ? "Pendiente de relación"
                : incident.costCenterName}
            </strong>
          </div>
          <div className="meta-box">
            <span>Categoría</span>
            <strong>{incident.category}</strong>
          </div>
          <div className="meta-box">
            <span>Responsable de TI</span>
            <strong>{incident.tiOwner}</strong>
          </div>
        </div>
        <h3>Descripción detallada</h3>
        <p className="muted">{incident.detail}</p>
        <h3>Seguimiento</h3>
        <ul className="comments">
          {incident.comments.map((comment) => (
            <li key={comment}>{comment}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
