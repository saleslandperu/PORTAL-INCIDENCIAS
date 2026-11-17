import { Router } from "express";
import { currentUser, requireAuth } from "../middleware/auth.ts";
import { findByLogin, rolesOf, toPublic, verifyPassword } from "../repos/users.ts";

export const authRouter = Router();

authRouter.post("/api/auth/login", async (req, res) => {
  const identifier = String(req.body?.identifier ?? "").trim();
  const password = String(req.body?.password ?? "");
  if (!identifier || !password) {
    res.status(400).json({ error: "Ingrese usuario y contraseña.", code: "VALIDATION" });
    return;
  }
  const user = findByLogin(identifier);
  if (!user || user.status !== "activo" || !(await verifyPassword(user, password))) {
    res.status(401).json({ error: "Usuario o contraseña no válidos.", code: "INVALID_CREDENTIALS" });
    return;
  }
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  req.session.userId = user.id;
  res.json({ user: toPublic(user) });
});

authRouter.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

authRouter.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: currentUser(req), roles: req.session.userId ? rolesOf(req.session.userId) : [] });
});
