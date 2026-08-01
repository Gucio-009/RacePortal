import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.js";
import { eventsRouter } from "./routes/events.js";
import { garageRouter } from "./routes/garage.js";
import { registrationsRouter } from "./routes/registrations.js";
import { adminRouter } from "./routes/admin.js";
import { organizerRouter } from "./routes/organizer.js";
import { mapsRouter } from "./routes/maps.js";
import { healthRouter } from "./routes/health.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  const origins = (process.env.CORS_ORIGIN || "*").split(",").map((s) => s.trim());
  app.use(
    cors({
      origin: origins.includes("*") ? true : origins,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use("/api", apiLimiter);

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/garage", garageRouter);
  app.use("/api/registrations", registrationsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/organizer", organizerRouter);
  app.use("/api/maps", mapsRouter);

  app.use(errorHandler);
  return app;
}
