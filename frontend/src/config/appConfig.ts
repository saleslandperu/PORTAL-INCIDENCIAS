/**
 * Configuración visible en la interfaz. No incluye secretos ni variables VITE_ de GLPI.
 */
export const appConfig = {
  appName: "Portal de Gestión de Incidencias TI",
  appShortName: "Portal TI",
  organizationLabel: "Área de Tecnología de la Información",
  demoMode: true,
  integrations: {
    glpi: {
      enabled: false,
      notes:
        "Consulta de solo lectura vía backend (OAuth password grant, POST /api.php/token y GET /api.php/v2/Ticket). El centro de costo no se infiere hasta validar solicitante ↔ maestro de trabajadores. No listo para producción.",
    },
    chatbot: {
      enabled: false,
      notes: "Pendiente: canal de registro y consulta asistida de incidencias.",
    },
    authentication: {
      enabled: true,
      notes:
        "Sesiones httpOnly en el servidor y bcrypt en SQLite cuando el backend está activo. El prototipo en el navegador queda como respaldo si el servidor no responde. No declarar producción hasta validar autenticación, permisos y acceso real a GLPI.",
    },
  },
} as const;
