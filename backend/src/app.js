const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { ZodError } = require("zod");
const { HttpError } = require("./errors");
const { createLimiters } = require("./middleware/limits");
const logger = require("./logger");

function createApp({ models, config, getDbStatus = () => "unknown" }) {
  const app = express();
  const limiters = createLimiters(config.limits);
  app.disable("x-powered-by");
  if (config.trustProxy) app.set("trust proxy", config.trustProxy);
  app.use(helmet());

  // Explicit CORS allow-list. Browsers from other origins get a hard 403 (and no CORS headers).
  // Remember: CORS only protects browsers; authentication/authorization is enforced separately.
  // In development any http://localhost:<port> or 127.0.0.1:<port> is accepted so a different dev port just works.
  const originAllowed = (origin) =>
    config.corsOrigins.includes(origin) || (!config.isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
  app.use((req, res, next) => {
    const origin = req.get("origin");
    if (origin && !originAllowed(origin)) return res.status(403).json({ message: "Origin not allowed", hint: "Add this origin to CORS_ORIGINS in backend/.env" });
    next();
  });
  app.use(cors({
    origin: (origin, cb) => cb(null, !origin || originAllowed(origin)),
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok", database: getDbStatus() }));

  const payments = require("./routes/payments")({ models, config, limiters });
  // The webhook needs the exact raw bytes to verify its signature, so it is mounted BEFORE express.json().
  app.post("/api/payments/webhook", express.raw({ type: "application/json", limit: "10kb" }), payments.webhook);

  app.use(express.json({ limit: "100kb" }));
  app.use("/api", limiters.api);

  app.use("/api/events", require("./routes/events")({ models, config }));
  app.use("/api", require("./routes/auth")({ models, config, limiters }));
  app.use("/api/bookings", require("./routes/bookings")({ models, config, limiters }));
  app.use("/api/payments", payments.demo);
  app.use("/api/messages", require("./routes/messages")({ models, limiters }));

  app.use("/api", (_req, res) => res.status(404).json({ message: "Not found" }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Please check the highlighted fields",
        errors: err.issues.map((i) => ({ field: i.path.join(".") || "body", message: i.message })),
      });
    }
    if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, ...err.extra });
    if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Malformed JSON" });
    if (err.type === "entity.too.large") return res.status(413).json({ message: "Request too large" });
    logger.error("unhandled", { name: err.name, message: err.message }); // no bodies, no PII
    res.status(500).json({ message: "Something went wrong. Please try again." });
  });

  return app;
}
module.exports = { createApp };
