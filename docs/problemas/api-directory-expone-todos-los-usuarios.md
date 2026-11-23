# `/api/directory` expone todos los usuarios a cualquier sesión

- **Detectado:** 2026-11-23
- **Estado:** pendiente
- **Archivo:** `backend/src/routes/directory.ts`

## Problema

`GET /api/directory` solo exige sesión (`requireAuth`), sin permiso específico. Cualquier usuario con sesión (KAM, gerente, técnico, consulta) recibe:

- **Todos** los usuarios: nombre, usuario, correo, rol, estado, jefe y centros de costo asignados.
- El catálogo completo de centros de costo, con quién tiene asignado cada uno.

Los usuarios con permiso `users.view` (Administrador TI) reciben además el detalle completo. No se exponen contraseñas ni hashes.

Ejemplo: un KAM puede ver los correos de todos los gerentes y qué centros de costo tiene cada persona.

## Por qué existe

El frontend usa este endpoint para armar el alcance de cada usuario (`buildAccessScope` en `frontend/src/services/accessService.ts`) y los filtros por KAM y centro de costo. Por eso lo piden todos los roles.

Desde 2026-11-23 el **filtrado de tickets se hace en el backend** (`backend/src/ticketScope.ts`), así que el frontend ya no es la barrera de seguridad para los tickets. Esto se puede recortar sin abrir un hueco.

## Propuesta

Que cada usuario reciba solo lo que le corresponde:

| Rol | Debería recibir |
| --- | --- |
| Administrador TI (`users.view`) | Todo (como hoy) |
| Gerente | Él mismo, sus KAM a cargo y los CC de ambos |
| KAM | Él mismo y sus CC |
| Técnico TI con CC | Él mismo y sus CC |
| Consulta / Técnico TI sin CC | Él mismo y el catálogo de CC (sin asignaciones de otros usuarios) |

Al implementarlo, revisar que en el frontend sigan funcionando:

- El filtro por KAM del gerente (`useScopedCatalogs` en `frontend/src/hooks/useScopedIncidents.ts`).
- El selector de centros de costo y la página de configuración (`SettingsPage.tsx`).
- Las reglas de alcance en `backend/src/ticketScope.ts`, que pueden servir para calcular qué devolver.
