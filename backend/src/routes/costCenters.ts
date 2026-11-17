import { Router } from "express";
import { routeParam } from "../http.ts";
import { requireAuth, requirePermission } from "../middleware/auth.ts";
import { assigneesOf, listCostCenters, setCostCenterStatus, upsertCostCenter } from "../repos/costCenters.ts";

export const costCentersRouter = Router();

costCentersRouter.get("/api/cost-centers", requireAuth, (_req, res) => {
  res.json({
    costCenters: listCostCenters().map((center) => ({
      ...center,
      assigneeIds: assigneesOf(center.id).map((item) => item.user_id),
    })),
  });
});

costCentersRouter.post("/api/cost-centers", requireAuth, requirePermission("cost_centers.manage", "No autorizado para administrar centros de costo."), (req, res) => {
  try {
    const center = upsertCostCenter({
      code: String(req.body.code ?? ""),
      name: String(req.body.name ?? ""),
      description: String(req.body.description ?? ""),
      status: req.body.status === "inactivo" ? "inactivo" : "activo",
      kamIds: Array.isArray(req.body.kamIds) ? req.body.kamIds : [],
    });
    res.status(201).json({ costCenter: center });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo crear." });
  }
});

costCentersRouter.put("/api/cost-centers/:id", requireAuth, requirePermission("cost_centers.manage", "No autorizado para administrar centros de costo."), (req, res) => {
  try {
    const center = upsertCostCenter({
      id: routeParam(req.params.id),
      code: String(req.body.code ?? ""),
      name: String(req.body.name ?? ""),
      description: String(req.body.description ?? ""),
      status: req.body.status === "inactivo" ? "inactivo" : "activo",
      kamIds: Array.isArray(req.body.kamIds) ? req.body.kamIds : undefined,
    });
    res.json({ costCenter: center });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo actualizar." });
  }
});

costCentersRouter.patch("/api/cost-centers/:id/status", requireAuth, requirePermission("cost_centers.manage", "No autorizado para administrar centros de costo."), (req, res) => {
  try {
    const center = setCostCenterStatus(routeParam(req.params.id), req.body.status === "inactivo" ? "inactivo" : "activo");
    res.json({ costCenter: center });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo cambiar el estado." });
  }
});
