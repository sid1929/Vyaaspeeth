const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { makeHarness } = require("./helpers/harness");
const { SERVICE_FEE } = require("../src/catalog");

test("events catalog is public and exposes the fee", async () => {
  const h = makeHarness();
  const res = await h.api.get("/api/events");
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.events.length >= 8);
  assert.strictEqual(res.body.serviceFee, SERVICE_FEE);
  assert.strictEqual((await h.api.get("/api/events/999")).status, 404);
});

test("frontend catalog copy matches the backend source of truth", () => {
  const a = path.join(__dirname, "../data/events.json");
  const b = path.join(__dirname, "../../frontend/lib/catalog.json");
  if (!fs.existsSync(b)) return; // backend deployed alone
  assert.strictEqual(fs.readFileSync(a, "utf8"), fs.readFileSync(b, "utf8"), "Run: cp backend/data/events.json frontend/lib/catalog.json");
});

test("contact/feedback validates input, honeypot is silently dropped, and spam is rate limited", async () => {
  const h = makeHarness({ limits: { messages: { windowMs: 60_000, limit: 4 } } });
  const good = { kind: "contact", name: "Asha Rao", email: "a@example.test", message: "Hello, I have a question about tickets." };
  assert.strictEqual((await h.api.post("/api/messages").send({ ...good, message: "short" })).status, 400);
  const bot = await h.api.post("/api/messages").send({ ...good, website: "http://spam.example" });
  assert.strictEqual(bot.status, 201);
  assert.strictEqual(h.models.Message.docs.length, 0);
  assert.strictEqual((await h.api.post("/api/messages").send(good)).status, 201);
  assert.strictEqual(h.models.Message.docs.length, 1);
  assert.strictEqual((await h.api.post("/api/messages").send(good)).status, 201);
  assert.strictEqual((await h.api.post("/api/messages").send(good)).status, 429);
});

test("unknown API routes return JSON 404 without internals", async () => {
  const h = makeHarness();
  const res = await h.api.get("/api/admin");
  assert.strictEqual(res.status, 404);
  assert.deepStrictEqual(res.body, { message: "Not found" });
});
