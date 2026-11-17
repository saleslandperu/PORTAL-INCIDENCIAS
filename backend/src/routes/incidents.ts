import { Router, type Request, type Response } from "express";
import { GlpiConfigError, GlpiRequestError, listAllGlpiTickets } from "../glpi/client.ts";
import { fetchTicketCostCodes } from "../glpi/costCentersDb.ts";
import { mapGlpiTicket } from "../glpi/mapper.ts";
import { listCostCenters } from "../repos/costCenters.ts";
import { requireAuth, requirePermission } from "../middleware/auth.ts";

export const incidentsRouter = Router();

incidentsRouter.get("/api/incidents", requireAuth, requirePermission("incidents.view", "No autorizado para consultar incidencias."), async (_req: Request, res: Response) => {
  try {
    const raw = await listAllGlpiTickets();  // el dashboard necesita todos los tickets, no una página
    const incidents = [];
    for (const item of raw) {
      try {
        incidents.push(mapGlpiTicket(item));
      } catch {
        // Se omite un elemento sin id; no se inventa identificador.
      }
    }

    // Relación ticket → centro de costo: el código lo escribe el bot en el bloque Fields de GLPI
    // (la API v2 no lo expone, se lee por MySQL). Se cruza con el catálogo del portal (id = code).
    let linked = 0;
    try {
      const codes = await fetchTicketCostCodes(incidents.map((i) => i.id));
      if (codes.size > 0) {
        const catalog = new Map(listCostCenters().map((c) => [c.id, c]));
        for (const inc of incidents) {
          const code = codes.get(inc.id);
          if (!code) continue;
          const cc = catalog.get(code) ?? catalog.get(code.toUpperCase());
          inc.costCenterId = code;
          inc.costCenterName = cc ? cc.name : `Centro ${code} (fuera del catálogo)`;
          inc.costCenterAssignmentStatus = "assigned";
          inc.unavailableFields = inc.unavailableFields.filter((f) => f !== "costCenter");
          linked += 1;
        }
      }
    } catch (error) {
      // Si la lectura por MySQL falla, se responde igual con "pendiente de relación": no se cae el endpoint.
      console.error("[incidents] No se pudo leer el centro de costo por ticket:", (error as Error).message);
    }

    res.json({
      source: "glpi",
      note: `Centro de costo tomado del bloque de datos del solicitante (tickets del bot): ${linked} de ${incidents.length} relacionados.`,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    if (error instanceof GlpiConfigError) {
      res.status(503).json({
        error: error.message,
        code: error.code,
        source: "unconfigured",
      });
      return;
    }
    if (error instanceof GlpiRequestError) {
      res.status(error.status).json({ error: error.message, code: error.code, source: "glpi" });
      return;
    }
    res.status(502).json({ error: "Error inesperado al consultar GLPI.", code: "GLPI_ERROR" });
  }
});

function glpiReadOnly(_req: Request, res: Response) {
  res.status(403).json({
    error: "La integración con GLPI es de solo lectura. No se crean, editan ni cierran tickets desde el portal.",
    code: "GLPI_READ_ONLY",
  });
}

incidentsRouter.post("/api/incidents", requireAuth, requirePermission("incidents.create"), glpiReadOnly);
incidentsRouter.put("/api/incidents/:id", requireAuth, requirePermission("incidents.edit"), glpiReadOnly);
incidentsRouter.patch("/api/incidents/:id/close", requireAuth, requirePermission("incidents.close"), glpiReadOnly);
