# Portal de Gestión de Incidencias TI

Aplicación de consulta gerencial. El frontend conserva las pantallas de demostración. El backend (`backend/`) autentica usuarios en SQLite, administra el catálogo de centros de costo y consulta GLPI 11 en **solo lectura**.

**No está lista para producción** hasta validar autenticación, permisos y un acceso real a GLPI.

## Estructura

```
frontend/   React + Vite (puerto 5173, reenvía /api al backend)
backend/    Express + SQLite + cliente GLPI (puerto 3001, solo red interna de Docker)
docker/     Imagen de desarrollo Node 22 compartida
```

## Cómo ejecutar (Docker)

No se instala Node en el servidor: el código se monta en los contenedores y `node_modules` vive en volúmenes de Docker.

```bash
cp backend/.env.example backend/.env   # solo la primera vez
docker compose up -d --build
docker compose logs -f
```

Edite `backend/.env` **fuera del chat y del repositorio**. Defina `SESSION_SECRET` y `PORTAL_BOOTSTRAP_PASSWORD`. No use el prefijo `VITE_` ni ponga secretos de GLPI en el frontend. Tras cambiar `.env`: `docker compose restart backend`.

El portal queda en `http://<servidor>:5173`. Con `ALLOW_DEMO_USER_SEED=false` el arranque crea solo `PORTAL_BOOTSTRAP_USERNAME`; el resto de usuarios y centros de costo se crean desde el panel.

Detener: `docker compose down`. Limpiar también dependencias: `docker compose down -v --rmi local`.

### Comprobar el backend

```bash
curl http://127.0.0.1:5173/api/health
```

Debe responder `ok: true` y `productionReady: false`. `glpiConfigured` será `true` solo si completó las variables GLPI en `backend/.env`.

### Pruebas del servidor

```bash
docker compose exec backend npm test
```

## Autenticación

- `POST /api/auth/login` y cookie httpOnly `portal_ti_sid`. Contraseñas con bcrypt en SQLite (`backend/data/portal.sqlite`). Si el servidor no responde, no se puede iniciar sesión (no hay modo prototipo).
- El primer administrador sale de `PORTAL_BOOTSTRAP_USERNAME` / `PORTAL_BOOTSTRAP_PASSWORD` en `backend/.env`. Ninguna contraseña se documenta en el repositorio.
- `SESSION_SECRET` es obligatorio (mínimo 32 caracteres); sin él el backend no arranca. Genérelo con `openssl rand -hex 32`.

Solo **Administrador TI** crea, edita y desactiva usuarios (de uno en uno), asigna roles y centros de costo, y gestiona el catálogo de CC. Gerencia, KAM, Técnico TI y Usuario de consulta ven dashboard, incidencias y reportes. Técnico TI permanece como rol independiente.

## GLPI 11 (solo lectura)

Documentación usada:

- OAuth: [OAuth Clients](https://help.glpi-project.org/documentation/modules/configuration/oauth-clients.md)
- API v2: [RESTful API (V2)](https://help.glpi-project.org/documentation/modules/configuration/general/api/restful-api-v2.md)

Rutas documentadas (no inventadas):

- Token: `POST /api.php/token` (`grant_type=password`, `scope=api`)
- API versionada: `/api.php/v2/...`
- Colección de tickets: `GET /api.php/v2/Ticket` (el esquema GraphQL de la misma documentación usa el recurso `Ticket`; el esquema REST exacto se confirma en `/api.php/doc.json` de su instancia)

Las credenciales GLPI viven solo en `backend/.env`. El token OAuth permanece en memoria del proceso. El navegador nunca las recibe.

Los tickets reales **no** se filtran por centro de costo, KAM ni gerente. El centro de costo se muestra como **Pendiente de relación** hasta validar solicitante GLPI ↔ maestro de trabajadores. No se usa External ID para eso.

## Arquitectura

Navegador → Vite (`/api` proxy) → Express (`backend/`) → SQLite (usuarios, roles, CC) y GLPI (tickets, sin duplicarlos).

Esquema SQLite pensado para migrar luego a SQL Server: tablas `users`, `roles`, `user_roles`, `cost_centers`, `user_cost_centers`, `ticket_identity_map` (reservada, vacía).

## Pendiente antes de producción

- Validar login real, cookies y roles en un entorno controlado
- Completar y probar GLPI con `/api.php/doc.json` de la instancia
- Relacionar solicitante, maestro de trabajadores y centro de costo
- Revisar permisos de Técnico TI antes de ampliar autorización
- HTTPS, `SESSION_SECRET` propio y almacén de sesión persistente
