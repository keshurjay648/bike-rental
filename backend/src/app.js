import express from "express";
import cors from "cors";
import bikesRouter from "./routes/bikes.routes.js";
import bookingsRouter from "./routes/bookings.routes.js";
import paymentsRouter from "./routes/payments.routes.js";
import authRouter from "./routes/auth.routes.js";
import usersRouter from "./routes/users.routes.js";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { uploadsRoot } from "./middleware/upload.js";

const app = express();

const configuredOrigins = env.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const allowedOrigins = Array.from(new Set([...configuredOrigins]));

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, server-to-server, health checks).
      // Also allow browsers that report origin as "null" (e.g. file://)
      if (!origin || origin === "null") return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (localDevOriginPattern.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    }
  })
);
app.use(express.json());

// Serve uploaded bike images at http://localhost:PORT/uploads/...
app.use("/uploads", express.static(uploadsRoot));

app.get("/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

app.use("/api/bikes", bikesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
