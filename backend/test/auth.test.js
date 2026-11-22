const test = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const { makeHarness } = require("./helpers/harness");

test("signup validates input and never stores plaintext passwords", async () => {
  const h = makeHarness();
  assert.strictEqual((await h.api.post("/api/signup").send({ name: "A", email: "bad", password: "x" })).status, 400);
  assert.strictEqual((await h.api.post("/api/signup").send({ name: "Asha", email: "a@example.test", password: "alllettersonly" })).status, 400);
  const ok = await h.api.post("/api/signup").send({ name: "Asha Rao", email: "A@Example.test ", password: "Passw0rdTest" });
  assert.strictEqual(ok.status, 201);
  assert.ok(ok.body.token);
  assert.strictEqual(ok.body.user.email, "a@example.test"); // normalised
  const stored = h.models.User.docs[0];
  assert.notStrictEqual(stored.password, "Passw0rdTest");
  assert.match(stored.password, /^\$2[aby]\$/); // bcrypt
  assert.strictEqual(ok.body.user.password, undefined);
});

test("signup rejects unknown fields and NoSQL operator payloads", async () => {
  const h = makeHarness();
  const extra = await h.api.post("/api/signup").send({ name: "Asha", email: "a@example.test", password: "Passw0rdTest", role: "admin" });
  assert.strictEqual(extra.status, 400);
  const inj = await h.api.post("/api/login").send({ email: { $ne: null }, password: { $ne: null } });
  assert.strictEqual(inj.status, 400);
});

test("duplicate email is rejected", async () => {
  const h = makeHarness();
  const body = { name: "Asha Rao", email: "dup@example.test", password: "Passw0rdTest" };
  await h.api.post("/api/signup").send(body);
  assert.strictEqual((await h.api.post("/api/signup").send(body)).status, 409);
});

test("login failure responses are identical for unknown email and wrong password", async () => {
  const h = makeHarness();
  const u = await h.signup();
  const wrongPw = await h.api.post("/api/login").send({ email: u.email, password: "WrongPass123" });
  const unknown = await h.api.post("/api/login").send({ email: "nobody@example.test", password: "WrongPass123" });
  assert.strictEqual(wrongPw.status, 401);
  assert.strictEqual(unknown.status, 401);
  assert.deepStrictEqual(wrongPw.body, unknown.body);
  const good = await h.api.post("/api/login").send({ email: u.email, password: "Passw0rdTest" });
  assert.strictEqual(good.status, 200);
  assert.ok(good.body.token);
});

test("repeated failed logins are rate limited per account+IP, and success is not counted", async () => {
  const h = makeHarness({ limits: { loginFailures: { windowMs: 60_000, limit: 3 } } });
  const u = await h.signup();
  for (let i = 0; i < 3; i++) {
    assert.strictEqual((await h.api.post("/api/login").send({ email: u.email, password: "WrongPass123" })).status, 401);
  }
  assert.strictEqual((await h.api.post("/api/login").send({ email: u.email, password: "WrongPass123" })).status, 429);
  // a different account is unaffected
  assert.strictEqual((await h.api.post("/api/login").send({ email: "other@example.test", password: "x" })).status, 401);
});

test("protected routes require a valid token; forged and 'none' tokens are rejected", async () => {
  const h = makeHarness();
  assert.strictEqual((await h.api.get("/api/bookings")).status, 401);
  assert.strictEqual((await h.api.get("/api/bookings").set("Authorization", "Bearer abc.def.ghi")).status, 401);
  const forged = jwt.sign({ sub: "1".repeat(24), tv: 0 }, "wrong-secret", { algorithm: "HS256" });
  assert.strictEqual((await h.api.get("/api/me").set("Authorization", `Bearer ${forged}`)).status, 401);
  const none = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url") + "." +
    Buffer.from(JSON.stringify({ sub: "x", tv: 0 })).toString("base64url") + ".";
  assert.strictEqual((await h.api.get("/api/me").set("Authorization", `Bearer ${none}`)).status, 401);
});

test("logout invalidates the token on the server", async () => {
  const h = makeHarness();
  const u = await h.signup();
  assert.strictEqual((await h.api.get("/api/me").set(u.auth)).status, 200);
  assert.strictEqual((await h.api.post("/api/logout").set(u.auth)).status, 200);
  assert.strictEqual((await h.api.get("/api/me").set(u.auth)).status, 401);
  const again = await h.api.post("/api/login").send({ email: u.email, password: "Passw0rdTest" });
  assert.strictEqual((await h.api.get("/api/me").set({ Authorization: `Bearer ${again.body.token}` })).status, 200);
});

test("CORS: unknown origins are blocked, the configured origin is allowed", async () => {
  const h = makeHarness();
  assert.strictEqual((await h.api.get("/api/health").set("Origin", "https://evil.example")).status, 403);
  const ok = await h.api.get("/api/health").set("Origin", h.ORIGIN);
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers["access-control-allow-origin"], h.ORIGIN);
});

test("security headers are set and oversized or malformed bodies are rejected safely", async () => {
  const h = makeHarness();
  const res = await h.api.get("/api/health");
  assert.strictEqual(res.headers["x-content-type-options"], "nosniff");
  assert.strictEqual(res.headers["x-powered-by"], undefined);
  assert.strictEqual((await h.api.post("/api/login").set("Content-Type", "application/json").send("{bad json")).status, 400);
  assert.strictEqual((await h.api.post("/api/login").send({ email: "a@b.co", password: "x".repeat(200_000) })).status, 413);
});
