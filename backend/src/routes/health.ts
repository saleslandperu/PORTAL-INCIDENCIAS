import { Router } from "express";
import { glpiIsConfigured, serverConfig } from "../config.ts";

export const healthRouter = Router();

healthRouter.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "portal-incidencias-ti-server",
    glpiConfigured: glpiIsConfigured(),
    bootstrapReady: Boolean(serverConfig.bootstrapPassword),
    productionReady: false,
  });
});
