import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export const serverConfig = {
  port: Number(read("PORT") || "3001"),
  sessionSecret: read("SESSION_SECRET"),
  bootstrapUsername: read("PORTAL_BOOTSTRAP_USERNAME") || "admin.ti",
  bootstrapPassword: read("PORTAL_BOOTSTRAP_PASSWORD"),
  bootstrapEmail: read("PORTAL_BOOTSTRAP_EMAIL") || "admin.ti@localhost",
  allowDemoUserSeed: read("ALLOW_DEMO_USER_SEED") === "true",
  glpi: {
    baseUrl: read("GLPI_BASE_URL").replace(/\/$/, ""),
    clientId: read("GLPI_CLIENT_ID"),
    clientSecret: read("GLPI_CLIENT_SECRET"),
    username: read("GLPI_USERNAME"),
    password: read("GLPI_PASSWORD"),
    scope: read("GLPI_SCOPE") || "api",
    ticketLimit: Math.min(100, Math.max(1, Number(read("GLPI_TICKET_LIMIT") || "50"))),
    // Tope de tickets a traer paginando (el dashboard necesita todos, no una sola página).
    ticketMax: Math.min(20000, Math.max(100, Number(read("GLPI_TICKET_MAX") || "5000"))),
  },
  // MySQL de GLPI (solo lectura): el centro de costo por ticket vive en el bloque Fields, que la
  // API v2 no expone. TODO producción: usar un usuario de solo lectura dedicado en vez del del bot.
  glpiDb: {
    host: read("GLPI_DB_HOST"),
    port: Number(read("GLPI_DB_PORT") || "3306"),
    name: read("GLPI_DB_NAME"),
    user: read("GLPI_DB_USER"),
    password: read("GLPI_DB_PASS"),
  },
};

export function glpiIsConfigured(): boolean {
  const { baseUrl, clientId, clientSecret, username, password } = serverConfig.glpi;
  return Boolean(baseUrl && clientId && clientSecret && username && password);
}

export function glpiDbIsConfigured(): boolean {
  const { host, name, user } = serverConfig.glpiDb;
  return Boolean(host && name && user);
}

export function sessionSecretOrDev(): string {
  if (serverConfig.sessionSecret.length >= 32) return serverConfig.sessionSecret;
  // Sin secreto propio cualquiera podría firmar cookies de sesión: no arrancar.
  throw new Error("SESSION_SECRET falta o es muy corto (mínimo 32 caracteres) en backend/.env.");
}
