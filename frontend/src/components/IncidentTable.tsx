import type { Incident } from "../types/incident";
import { incidentService } from "../services/incidentService";
import { formatDateTime } from "../utils/dates";
import { PriorityChip, StatusChip } from "./StatusChip";

interface IncidentTableProps {
  rows: Incident[];
  onSelect: (incident: Incident) => void;
}

export function IncidentTable({ rows, onSelect }: IncidentTableProps) {
  if (rows.length === 0) {
    return <div className="empty">No hay incidencias para los filtros seleccionados.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Número de ticket</th>
            <th>Fecha de registro</th>
            <th>Solicitante</th>
            <th>Centro de costo</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Responsable de TI</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Tiempo transcurrido</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((incident) => {
            const extra = incidentService.withElapsed(incident);
            return (
              <tr key={incident.id} onClick={() => onSelect(incident)}>
                <td className="ticket">{incident.ticketNumber}</td>
                <td>{formatDateTime(incident.registeredAt)}</td>
                <td>{incident.requester}</td>
                <td>{incident.costCenterName}</td>
                <td>{incident.category}</td>
                <td className="desc">{incident.description}</td>
                <td>{incident.tiOwner}</td>
                <td>
                  <PriorityChip value={incident.priority} />
                </td>
                <td>
                  <StatusChip value={incident.status} />
                </td>
                <td>
                  {extra.elapsedLabel}
                  {extra.overdue ? (
                    <>
                      <br />
                      <span className="chip overdue">Vencida</span>
                    </>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
