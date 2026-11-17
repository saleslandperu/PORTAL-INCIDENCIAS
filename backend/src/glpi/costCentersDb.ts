/**
 * Lee el centro de costo por ticket desde la base de GLPI (solo SELECT).
 *
 * El código de centro de costo que el bot escribe en cada ticket vive en el bloque Fields
 * "Datos del solicitante" (tabla glpi_plugin_fields_ticketdatosdelsolicitantes, columna
 * cdigocentrodecostofield). La API v2 de GLPI no expone el plugin Fields, por eso se lee por MySQL.
 *
 * Solo tickets creados por el bot tienen este dato; el resto queda "pendiente de relación".
 */
import mysql from "mysql2/promise";
import { serverConfig, glpiDbIsConfigured } from "../config.ts";

const FIELDS_TABLE = "glpi_plugin_fields_ticketdatosdelsolicitantes";
const CODE_COLUMN = "cdigocentrodecostofield";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const d = serverConfig.glpiDb;
    pool = mysql.createPool({
      host: d.host,
      port: d.port,
      user: d.user,
      password: d.password,
      database: d.name,
      connectionLimit: 3,
      connectTimeout: 5000,
      waitForConnections: true,
    });
  }
  return pool;
}

/** Mapa { ticketId -> código de centro de costo } para los tickets dados. Vacío si no hay BD
 *  configurada o ningún ticket tiene el dato. Solo lee (SELECT); nunca escribe en GLPI. */
export async function fetchTicketCostCodes(ticketIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!glpiDbIsConfigured() || ticketIds.length === 0) return out;
  const ids = ticketIds.map((n) => Number(n)).filter((n) => Number.isInteger(n));
  if (ids.length === 0) return out;

  const placeholders = ids.map(() => "?").join(",");
  const sql =
    `SELECT items_id AS id, ${CODE_COLUMN} AS code FROM ${FIELDS_TABLE} ` +
    `WHERE itemtype = 'Ticket' AND items_id IN (${placeholders}) ` +
    `AND ${CODE_COLUMN} IS NOT NULL AND ${CODE_COLUMN} <> ''`;
  const [rows] = await getPool().query(sql, ids);
  for (const r of rows as Array<{ id: number; code: string }>) {
    out.set(String(r.id), String(r.code).trim());
  }
  return out;
}
