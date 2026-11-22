const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

// Development convenience: when a secret is not configured, generate one ONCE and keep it in a git-ignored file,
// so sessions survive server restarts (otherwise every restart logs everyone out). Never used in production.
const DEV_FILE = path.join(__dirname, "..", ".dev-secrets.json");
function devSecret(name) {
  if (process.env.NODE_ENV === "test") return crypto.randomBytes(48).toString("hex");
  let store = {};
  try { store = JSON.parse(fs.readFileSync(DEV_FILE, "utf8")); } catch { /* first run */ }
  if (!store[name]) {
    store[name] = crypto.randomBytes(48).toString("hex");
    try { fs.writeFileSync(DEV_FILE, JSON.stringify(store, null, 2), { mode: 0o600 }); } catch { /* read-only fs */ }
  }
  return store[name];
}

function secret(name, env, isProd) {
  const value = env[name];
  if (value && value.length >= 32) return value;
  if (isProd) throw new Error(`${name} is required in production and must be at least 32 characters.`);
  logger.warn("config.dev_secret", { name, note: "Using an auto-generated development secret (backend/.dev-secrets.json). Set it in .env for real deployments." });
  return devSecret(name);
}

function loadConfig(env = process.env) {
  const isProd = env.NODE_ENV === "production";
  return {
    isProd,
    port: Number(env.PORT || 5000),
    corsOrigins: (env.CORS_ORIGINS || "http://localhost:3000").split(",").map((s) => s.trim()).filter(Boolean),
    jwtSecret: secret("JWT_SECRET", env, isProd),
    jwtExpiresIn: env.JWT_EXPIRES_IN || "8h",
    paymentSecret: secret("PAYMENT_WEBHOOK_SECRET", env, isProd),
    enableMockPayments: env.ENABLE_MOCK_PAYMENTS ? env.ENABLE_MOCK_PAYMENTS === "true" : !isProd,
    trustProxy: env.TRUST_PROXY ? Number(env.TRUST_PROXY) : 0,
    bcryptRounds: 12,
    holdMinutes: 15,
    cancelWindowHours: 24,
    webhookToleranceSeconds: 300,
    limits: {
      api: { windowMs: 15 * 60_000, limit: 600 },
      auth: { windowMs: 15 * 60_000, limit: 30 },
      loginFailures: { windowMs: 15 * 60_000, limit: 5 },
      booking: { windowMs: 60 * 60_000, limit: 20 },
      messages: { windowMs: 60 * 60_000, limit: 5 },
    },
    now: () => new Date(),
  };
}
module.exports = { loadConfig };
