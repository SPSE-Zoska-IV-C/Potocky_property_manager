import dotenv from "dotenv";

dotenv.config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3001,
  host: process.env.HOST || "localhost",
  protocol: process.env.PROTOCOL || "http",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  corsOptions: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Accept",
      "Accept-Language",
      "Authorization",
      "Content-Language",
      "Content-Length",
      "Content-Type",
      "Origin",
      "X-Requested-With",
    ],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 10000,
  },
};

export default config;
