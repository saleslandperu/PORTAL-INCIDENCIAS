import { Router } from "express";
import { type RoleId } from "../permissions.ts";
import { requireAuth, requirePermission } from "../middleware/auth.ts";
import { routeParam } from "../http.ts";
import { listUsers, setUserStatus, upsertUser } from "../repos/users.ts";
import { serverConfig } from "../config.ts";

export const usersRouter = Router();

usersRouter.get("/api/users", requireAuth, requirePermission("users.view", "No autorizado para ver usuarios."), (_req, res) => {
  res.json({ users: listUsers() });
});

usersRouter.post("/api/users", requireAuth, requirePermission("users.create", "No autorizado para crear usuarios."), async (req, res) => {
  try {
    const user = await upsertUser({
      workerCode: req.body.workerCode,
      fullName: String(req.body.fullName ?? ""),
      username: String(req.body.username ?? ""),
      email: String(req.body.email ?? ""),
      status: req.body.status === "inactivo" ? "inactivo" : "activo",
      role: req.body.role as RoleId,
      managerId: req.body.managerId,
      costCenterIds: Array.isArray(req.body.costCenterIds) ? req.body.costCenterIds : [],
      password: req.body.password || serverConfig.bootstrapPassword,
    });
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo crear." });
  }
});

usersRouter.put("/api/users/:id", requireAuth, requirePermission("users.edit", "No autorizado para editar usuarios."), async (req, res) => {
  try {
    const user = await upsertUser({
      id: routeParam(req.params.id),
      workerCode: req.body.workerCode,
      fullName: String(req.body.fullName ?? ""),
      username: String(req.body.username ?? ""),
      email: String(req.body.email ?? ""),
      status: req.body.status === "inactivo" ? "inactivo" : "activo",
      role: req.body.role as RoleId,
      managerId: req.body.managerId,
      costCenterIds: Array.isArray(req.body.costCenterIds) ? req.body.costCenterIds : [],
      password: req.body.password,
    });
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo actualizar." });
  }
});

usersRouter.patch("/api/users/:id/status", requireAuth, requirePermission("users.toggle_status", "No autorizado para cambiar el estado de usuarios."), (req, res) => {
  try {
    const user = setUserStatus(routeParam(req.params.id), req.body.status === "inactivo" ? "inactivo" : "activo");
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo cambiar el estado." });
  }
});
