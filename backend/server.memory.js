// Zero-setup demo server: the full API backed by an in-memory store (no MongoDB needed).
// Data disappears when the process stops. Use `npm start` with MONGODB_URI for real persistence.
require("dotenv").config();
const { loadConfig } = require("./src/config");
const { createApp } = require("./src/app");
const { createFakeModels } = require("./src/dev/memory-models");

const config = loadConfig({ ...process.env, NODE_ENV: process.env.NODE_ENV || "development" });
const app = createApp({ models: createFakeModels(), config, getDbStatus: () => "in-memory" });
app.listen(config.port, () => console.log(`Vyaaspeeth API (IN-MEMORY demo mode) on http://localhost:${config.port}`));
