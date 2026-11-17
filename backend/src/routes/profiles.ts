import { Router } from "express";
import { routeParam } from "../http.ts";
import { requireAuth, requirePermission } from "../middleware/auth.ts";
import { PERMISSION_GROUPS, ROLE_IDS, type RoleId } from "../permissions.ts";
import { listProfiles, saveRolePermissions } from "../repos/rolePermissions.ts";

export const profilesRouter = Router();

profilesRouter.get(
  "/api/profiles",
  requireAuth,
  requirePermission("profiles.manage", "Solo Administrador TI puede gestionar perfiles."),
  (_req, res) => {
    res.json({ groups: PERMISSION_GROUPS, profiles: listProfiles() });
  },
);

profilesRouter.put(
  "/api/profiles/:roleId/permissions",
  requireAuth,
  requirePermission("profiles.manage", "Solo Administrador TI puede gestionar perfiles."),
  (req, res) => {
    const roleId = routeParam(req.params.roleId) as RoleId;
    if (!ROLE_IDS.includes(roleId)) {
      res.status(400).json({ error: "Perfil no válido." });
      return;
    }
    const permissionIds = Array.isArray(req.body?.permissionIds) ? req.body.permissionIds.map(String) : [];
    const profile = saveRolePermissions(roleId, permissionIds);
    res.json({ profile, profiles: listProfiles() });
  },
);
