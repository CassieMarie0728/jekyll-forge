import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { scheduledPublishHandler } from "../scheduledPublishHandler";
import { registerHeartbeatJobs } from "./heartbeatJobs";
import logger from "./logger";
import {
  createApiRateLimiter,
  createAuthRateLimiter,
  createPublicRateLimiter,
  closeRedisClient,
} from "./rateLimiter";
import { registerSwaggerUI } from "./swagger";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Initialize rate limiters
  const apiLimiter = await createApiRateLimiter();
  const authLimiter = await createAuthRateLimiter();
  const publicLimiter = await createPublicRateLimiter();

  // Apply rate limiters
  app.use("/api/trpc", apiLimiter);
  app.use("/api/oauth", authLimiter);
  app.use("/", publicLimiter);

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerSwaggerUI(app);
  // Heartbeat cron handler — must be before tRPC and Vite fallthrough
  app.post("/api/scheduled/publish-post", scheduledPublishHandler);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.warn(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`);
    logger.info(
      `API documentation available at http://localhost:${port}/api/docs`
    );
    // Register periodic heartbeat jobs
    registerHeartbeatJobs();
  });
}

startServer().catch(error => {
  logger.error("Server startup failed:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await closeRedisClient();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await closeRedisClient();
  process.exit(0);
});
