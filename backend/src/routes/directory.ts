import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { roleHasPermission } from "../repos/rolePermissions.ts";
import { assigneesOf, listCostCenters } from "../repos/costCenters.ts";
import { listUsers } from "../repos/users.ts";

export const directoryRouter = Router();

directoryRouter.get("/api/directory", requireAuth, (_req, res) => {
  const roles = (res.locals.roles as string[]) ?? [];
  const admin = roleHasPermission(roles, "users.view");
  const users = admin
    ? listUsers()
    : listUsers().map((user) => ({
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        managerId: user.managerId,
        costCenterIds: user.costCenterIds,
      }));
  res.json({
    users,
    costCenters: listCostCenters().map((center) => ({
      ...center,
      assigneeIds: assigneesOf(center.id).map((item) => item.user_id),
    })),
  });
});
