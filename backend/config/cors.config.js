import cors from "cors";

const isProd = process.env.NODE_ENV === "production";

/**
 * Centralized allowed origins
 * - Dev: localhost
 * - Prod: CLIENT_URL from env
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://192.168.2.36:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

/**
 * CORS options (production-safe)
 */
export const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (!isProd) {
      // In dev, log blocked origins for debugging
      console.warn("❌ CORS blocked:", origin);
    }

    return callback(new Error("CORS policy violation"), false);
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  exposedHeaders: ["Authorization"],

  credentials: true,

  maxAge: 600,
};

export const corsMiddleware = cors(corsOptions);
