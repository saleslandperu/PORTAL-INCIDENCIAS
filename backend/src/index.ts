import { createApp } from "./app.ts";
import { serverConfig } from "./config.ts";
import { bootstrapAdmin } from "./db.ts";
import { seedPermissionCatalog } from "./repos/rolePermissions.ts";
import { seedDemoIfAllowed } from "./seed.ts";

await bootstrapAdmin();
seedPermissionCatalog();
await seedDemoIfAllowed();
const app = createApp();
app.listen(serverConfig.port, () => {
  console.log(`Backend del portal en http://127.0.0.1:${serverConfig.port}`);
  if (!serverConfig.sessionSecret) {
    console.warn("SESSION_SECRET no está definido. Use un valor propio en server/.env; no apto para producción.");
  }
});
