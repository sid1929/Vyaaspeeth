// `npm run doctor`: checks the most common setup problems and prints how to fix them.
require("dotenv").config();
const mongoose = require("mongoose");

const ok = (m) => console.log(`  ✔ ${m}`);
const bad = (m, fix) => { console.log(`  ✘ ${m}\n      → ${fix}`); failed++; };
let failed = 0;

(async () => {
  console.log("\nVyaaspeeth backend doctor\n");
  const major = Number(process.versions.node.split(".")[0]);
  major >= 20 ? ok(`Node ${process.versions.node}`) : bad(`Node ${process.versions.node} is too old`, "Install Node 20 or newer.");

  const uri = process.env.MONGODB_URI;
  if (!uri) bad("MONGODB_URI is not set", "Copy backend/.env.example to backend/.env and set it, or use `npm run dev:memory` (no database needed).");
  else {
    ok(`MONGODB_URI is set (${uri.replace(/\/\/([^:]+):[^@]+@/, "//$1:****@").slice(0, 60)}…)`);
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      ok("Connected to MongoDB");
      await mongoose.disconnect();
    } catch (e) {
      bad(`Could not connect to MongoDB: ${e.message.slice(0, 120)}`, "Check the username/password, and in Atlas add your IP under Network Access (or 0.0.0.0/0 for testing).");
    }
  }
  const prod = process.env.NODE_ENV === "production";
  for (const k of ["JWT_SECRET", "PAYMENT_WEBHOOK_SECRET"]) {
    const v = process.env[k];
    if (v && v.length >= 32) ok(`${k} is set`);
    else if (prod) bad(`${k} missing or shorter than 32 characters`, 'Generate: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    else ok(`${k} not set: using an auto-generated development secret (fine locally)`);
  }
  const origins = process.env.CORS_ORIGINS || "http://localhost:3000";
  ok(`CORS_ORIGINS = ${origins}${prod ? "" : " (any localhost port is also allowed in development)"}`);
  if (prod && /localhost/.test(origins)) bad("CORS_ORIGINS points at localhost in production", "Set it to your deployed frontend origin, e.g. https://your-app.vercel.app");
  const mock = process.env.ENABLE_MOCK_PAYMENTS ? process.env.ENABLE_MOCK_PAYMENTS === "true" : !prod;
  ok(`Demo payments are ${mock ? "ON" : "OFF"}${!mock ? " (bookings cannot be paid until a real provider is added or ENABLE_MOCK_PAYMENTS=true)" : ""}`);
  console.log(failed ? `\n${failed} problem(s) found.\n` : "\nAll good. Start the API with `npm run dev`.\n");
  process.exit(failed ? 1 : 0);
})();
