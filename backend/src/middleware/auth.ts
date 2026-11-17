import type { NextFunction, Request, Response } from "express";
import { findById, rolesOf, toPublic } from "../repos/users.ts";
import { roleHasPermission } from "../repos/rolePermissions.ts";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export function currentUser(req: Request) {
  const id = req.session.userId;
  if (!id) return null;
  const row = findById(id);
  if (!row || row.status !== "activo") return null;
  return toPublic(row);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Debe iniciar sesión.", code: "UNAUTHENTICATED" });
    return;
  }
  res.locals.user = user;
  res.locals.roles = rolesOf(user.id);
  next();
}

export function requirePermission(permissionId: string, message = "No autorizado.") {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = (res.locals.roles as string[]) ?? [];
    if (permissionId === "profiles.manage" && !roles.includes("admin_ti")) {
      res.status(403).json({ error: "Solo Administrador TI puede gestionar perfiles.", code: "FORBIDDEN" });
      return;
    }
    if (!roleHasPermission(roles, permissionId)) {
      res.status(403).json({ error: message, code: "FORBIDDEN" });
      return;
    }
    next();
  };
}
