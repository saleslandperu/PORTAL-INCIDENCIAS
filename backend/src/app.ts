import cors from "cors";
import express from "express";
import session from "express-session";
import { sessionSecretOrDev } from "./config.ts";
import { authRouter } from "./routes/auth.ts";
import { costCentersRouter } from "./routes/costCenters.ts";
import { directoryRouter } from "./routes/directory.ts";
import { healthRouter } from "./routes/health.ts";
import { incidentsRouter } from "./routes/incidents.ts";
import { profilesRouter } from "./routes/profiles.ts";
import { usersRouter } from "./routes/users.ts";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    }),
  );
  app.use(
    session({
      name: "portal_ti_sid",
      secret: sessionSecretOrDev(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 8 * 60 * 60 * 1000,
      },
    }),
  );
  app.use(healthRouter);
  app.use(authRouter);
  app.use(directoryRouter);
  app.use(usersRouter);
  app.use(costCentersRouter);
  app.use(profilesRouter);
  app.use(incidentsRouter);
  return app;
}
