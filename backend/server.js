require("dotenv").config();
const mongoose = require("mongoose");
const { loadConfig } = require("./src/config");
const { createApp } = require("./src/app");
const logger = require("./src/logger");

async function start() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Copy backend/.env.example to backend/.env, or run `npm run dev:memory` for a zero-setup demo.");
  }
  const config = loadConfig();
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  logger.info("db.connected");

  const models = require("./src/models");
  // Make sure unique indexes (e.g. one lock per seat) exist BEFORE serving traffic.
  await Promise.all(Object.values(models).map((m) => m.init()));

  const app = createApp({ models, config, getDbStatus: () => (mongoose.connection.readyState === 1 ? "connected" : "disconnected") });
  const server = app.listen(config.port, () => logger.info("api.listening", { port: config.port, mockPayments: config.enableMockPayments }));

  const shutdown = () => server.close(() => mongoose.disconnect().then(() => process.exit(0)));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((error) => {
  console.error("\nFailed to start API:", error.message);
  console.error("Run `npm run doctor` for a step-by-step diagnosis.\n");
  process.exit(1);
});
