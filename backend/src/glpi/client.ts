import { glpiIsConfigured, serverConfig } from "../config.ts";

/**
 * Cliente GLPI 11 según documentación oficial:
 * - Token: POST /api.php/token (grant_type=password, scope=api)
 * - API: /api.php/v2/...
 * - Esquema Ticket: GET /api.php/doc.json cuando esté disponible
 * El token permanece en memoria del proceso. Nunca se envía al navegador.
 */
interface TokenState {
  accessToken: string;
  expiresAt: number;
}

let tokenState: TokenState | null = null;

export class GlpiConfigError extends Error {
  code = "GLPI_NOT_CONFIGURED";
  constructor() {
    super("GLPI no está configurado en el servidor.");
  }
}

export class GlpiRequestError extends Error {
  constructor(
    message: string,
    public status = 502,
    public code = "GLPI_ERROR",
  ) {
    super(message);
  }
}

function requireConfig() {
  if (!glpiIsConfigured()) throw new GlpiConfigError();
}

async function requestToken(): Promise<TokenState> {
  requireConfig();
  const { baseUrl, clientId, clientSecret, username, password, scope } = serverConfig.glpi;
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
    scope,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseUrl}/api.php/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok || typeof payload.access_token !== "string") {
      throw new GlpiRequestError("No fue posible autenticar con GLPI.", 502, "GLPI_AUTH_FAILED");
    }
    const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 3600;
    return {
      accessToken: payload.access_token,
      expiresAt: Date.now() + Math.max(30, expiresIn - 60) * 1000,
    };
  } catch (error) {
    if (error instanceof GlpiRequestError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new GlpiRequestError("Tiempo de espera agotado al autenticar con GLPI.", 504, "GLPI_TIMEOUT");
    }
    throw new GlpiRequestError("Error de red al autenticar con GLPI.", 502, "GLPI_NETWORK");
  } finally {
    clearTimeout(timer);
  }
}

async function bearerToken() {
  if (!tokenState || Date.now() >= tokenState.expiresAt) {
    tokenState = await requestToken();
  }
  return tokenState.accessToken;
}

export function clearGlpiToken() {
  tokenState = null;
}

export async function glpiGet(path: string) {
  requireConfig();
  const token = await bearerToken();
  const url = `${serverConfig.glpi.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: controller.signal,
    });
    if (response.status === 401) {
      clearGlpiToken();
      throw new GlpiRequestError("El token de GLPI expiró o no es válido.", 502, "GLPI_TOKEN_EXPIRED");
    }
    if (response.status === 403) {
      throw new GlpiRequestError("El usuario técnico no tiene permiso de consulta en GLPI.", 502, "GLPI_FORBIDDEN");
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload === null) {
      throw new GlpiRequestError("GLPI devolvió una respuesta no válida.", 502, "GLPI_INVALID_RESPONSE");
    }
    return payload;
  } catch (error) {
    if (error instanceof GlpiRequestError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new GlpiRequestError("Tiempo de espera agotado al consultar GLPI.", 504, "GLPI_TIMEOUT");
    }
    throw new GlpiRequestError("Error de red al consultar GLPI.", 502, "GLPI_NETWORK");
  } finally {
    clearTimeout(timer);
  }
}

export async function listGlpiTickets(start = 0, limit = serverConfig.glpi.ticketLimit) {
  const safeLimit = Math.min(limit, 100);
  // GLPI 11 agrupa los tickets bajo el namespace "Assistance" en la API v2 (verificado en 11.0.5:
  // /api.php/v2/Ticket da 404; /api.php/v2/Assistance/Ticket devuelve la lista).
  const payload = await glpiGet(`/api.php/v2/Assistance/Ticket?start=${start}&limit=${safeLimit}`);
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.items)) return record.items;
  }
  throw new GlpiRequestError("La lista de tickets no tiene un formato reconocido.", 502, "GLPI_INVALID_RESPONSE");
}

/**
 * Trae TODOS los tickets paginando (el dashboard necesita el total, no una sola página).
 * Página de 100 (tope de la API v2); se detiene al llegar a una página incompleta o al tope
 * de seguridad `max` (GLPI_TICKET_MAX), para no quedar en un bucle si algo devuelve siempre lleno.
 */
export async function listAllGlpiTickets(max = serverConfig.glpi.ticketMax): Promise<unknown[]> {
  const pageSize = 100;
  const all: unknown[] = [];
  for (let start = 0; start < max; start += pageSize) {
    const page = await listGlpiTickets(start, Math.min(pageSize, max - start));
    all.push(...page);
    if (page.length < pageSize) break; // última página: ya no hay más
  }
  return all;
}
