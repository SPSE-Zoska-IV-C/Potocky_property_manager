import express from "express";
import http from "http";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import config from "./config";
import { initWebSocket } from "./websocket"; // Import WebSocket initializer

const app = express();
const server = http.createServer(app); // Create HTTP server

// security middleware
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.frameguard({ action: "deny" }));
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  })
);

// rate limiting
app.use(rateLimit(config.rateLimit));

// parse cookies
app.use(cookieParser());

// Stripe webhook raw body middleware
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

// Regular body parser for other routes
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// compression
app.use(compression());

// cors
app.use(cors(config.corsOptions));

// trust proxy
app.set("trust proxy", 1);

// health check endpoint
app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// api routes
const mainRouter = express.Router();
Object.entries(routes).forEach(([path, router]) => {
  mainRouter.use(`/${path}`, router);
});
app.use("/api", mainRouter);

// error handling
app.use(errorHandler);

// handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// handle unhandled promise rejections
process.on("unhandledRejection", (reason: any) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// initialize websocket server
initWebSocket(server);

async function startServer() {
  try {
    server.listen(config.port, () => {
      const address = server.address();
      if (!address || typeof address === "string") return;

      console.log(`
🚀 Server running at ${config.protocol}://${config.host}:${address.port}
🔧 Environment: ${config.env}
⏰ ${new Date().toISOString()}
`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.syscall !== "listen") throw error;

      const bind =
        typeof config.port === "string"
          ? `Pipe ${config.port}`
          : `Port ${config.port}`;

      switch (error.code) {
        case "EACCES":
          console.error(`${bind} requires elevated privileges`);
          process.exit(1);
        case "EADDRINUSE":
          console.error(`${bind} is already in use`);
          process.exit(1);
        default:
          throw error;
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
