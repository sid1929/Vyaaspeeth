const test = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");
const { makeHarness } = require("./helpers/harness");

const signed = (h, body, { ts = Math.floor(Date.now() / 1000), secret = h.config.paymentSecret } = {}) => {
  const raw = JSON.stringify(body);
  const sig = crypto.createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex");
  return { raw, headers: { "Content-Type": "application/json", "x-vyaas-timestamp": String(ts), "x-vyaas-signature": sig } };
};
const evt = (booking, o = {}) => ({
  id: "evt_12345678", type: "payment.succeeded",
  data: { bookingReference: booking.bookingReference, amount: booking.total, providerRef: "prov_123456" }, ...o,
});
const send = (h, { raw, headers }) => h.api.post("/api/payments/webhook").set(headers).send(raw);

async function setup(over) {
  const h = makeHarness(over);
  const u = await h.signup();
  const booking = (await h.book(u)).body.booking;
  return { h, u, booking };
}

test("a booking cannot be confirmed by the client: no field or endpoint skips payment", async () => {
  const { h, u, booking } = await setup();
  const stored = h.models.Booking.docs[0];
  assert.strictEqual(stored.status, "Pending");
  assert.strictEqual(stored.paymentStatus, "Pending");
  assert.strictEqual((await h.api.post(`/api/bookings/${booking.bookingReference}/confirm`).set(u.auth)).status, 404);
});

test("webhook without a valid signature is rejected and changes nothing", async () => {
  const { h, booking } = await setup();
  const body = evt(booking);
  assert.strictEqual((await h.api.post("/api/payments/webhook").set("Content-Type", "application/json").send(JSON.stringify(body))).status, 401);
  assert.strictEqual((await send(h, signed(h, body, { secret: "x".repeat(40) }))).status, 401);
  assert.strictEqual(h.models.Booking.docs[0].status, "Pending");
});

test("stale timestamps (replay of an old signed request) are rejected", async () => {
  const { h, booking } = await setup();
  const old = Math.floor(Date.now() / 1000) - 3600;
  assert.strictEqual((await send(h, signed(h, evt(booking), { ts: old }))).status, 401);
});

test("a validly signed success event confirms the booking exactly once (idempotent)", async () => {
  const { h, u, booking } = await setup();
  const first = await send(h, signed(h, evt(booking)));
  assert.strictEqual(first.status, 200);
  assert.strictEqual(first.body.outcome, "confirmed");
  const mine = await h.api.get(`/api/bookings/${booking.bookingReference}`).set(u.auth);
  assert.strictEqual(mine.body.booking.status, "Confirmed");
  assert.strictEqual(mine.body.booking.paymentStatus, "Completed");
  const replay = await send(h, signed(h, evt(booking)));
  assert.strictEqual(replay.status, 200);
  assert.strictEqual(replay.body.outcome, "duplicate");
});

test("an event whose amount differs from the booking total is refused", async () => {
  const { h, booking } = await setup();
  const res = await send(h, signed(h, evt(booking, { data: { bookingReference: booking.bookingReference, amount: 1, providerRef: "prov_123456" } })));
  assert.strictEqual(res.status, 400);
  assert.strictEqual(h.models.Booking.docs[0].status, "Pending");
});

test("payload validation: unknown fields and bad references are rejected", async () => {
  const { h, booking } = await setup();
  const extra = evt(booking); extra.data.status = "Confirmed";
  assert.strictEqual((await send(h, signed(h, extra))).status, 400);
  const bad = evt(booking); bad.data.bookingReference = { $ne: null };
  assert.strictEqual((await send(h, signed(h, bad))).status, 400);
});

test("demo gateway: success confirms, failure keeps the hold so the user can retry", async () => {
  const { h, u, booking } = await setup();
  const ref = booking.bookingReference;
  const fail = await h.api.post("/api/payments/mock-checkout").set(u.auth).send({ bookingReference: ref, method: "UPI", simulate: "fail" });
  assert.strictEqual(fail.status, 200);
  assert.strictEqual(fail.body.booking.status, "Pending");
  assert.strictEqual(fail.body.booking.paymentStatus, "Failed");
  const ok = await h.api.post("/api/payments/mock-checkout").set(u.auth).send({ bookingReference: ref, method: "UPI" });
  assert.strictEqual(ok.body.booking.status, "Confirmed");
  assert.strictEqual(ok.body.booking.paymentMethod, "UPI");
});

test("demo gateway is unavailable when disabled (production default)", async () => {
  const { h, u, booking } = await setup({ enableMockPayments: false });
  const res = await h.api.post("/api/payments/mock-checkout").set(u.auth).send({ bookingReference: booking.bookingReference, method: "UPI" });
  assert.strictEqual(res.status, 404);
});

test("confirmed bookings can be cancelled with a refund only outside the cancellation window", async () => {
  let now = new Date("2026-11-21T10:00:00Z");
  const h = makeHarness({ now: () => now });
  const u = await h.signup();
  const ref = (await h.book(u)).body.booking.bookingReference;
  await h.api.post("/api/payments/mock-checkout").set(u.auth).send({ bookingReference: ref, method: "UPI" });
  const ok = await h.api.post(`/api/bookings/${ref}/cancel`).set(u.auth);
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.body.booking.paymentStatus, "Refunded");

  const ref2 = (await h.book(u)).body.booking.bookingReference;
  await h.api.post("/api/payments/mock-checkout").set(u.auth).send({ bookingReference: ref2, method: "UPI" });
  now = new Date("2027-01-23T12:00:00Z"); // event 2 starts 2027-01-23 20:00 IST (14:30Z): inside the 24h window
  const late = await h.api.post(`/api/bookings/${ref2}/cancel`).set(u.auth);
  assert.strictEqual(late.status, 409);
});

test("paid seats stay sold; cancelling a confirmed booking releases them", async () => {
  const h = makeHarness();
  const u = await h.signup();
  const seats = h.pickSeats("2", 2);
  const ref = (await h.book(u, { seats })).body.booking.bookingReference;
  await h.api.post("/api/payments/mock-checkout").set(u.auth).send({ bookingReference: ref, method: "UPI" });
  assert.ok(h.models.SeatLock.docs.every((l) => l.status === "sold" && l.expiresAt === null));
  const other = await h.signup();
  assert.strictEqual((await h.book(other, { seats })).status, 409);
  await h.api.post(`/api/bookings/${ref}/cancel`).set(u.auth);
  assert.strictEqual((await h.book(other, { seats })).status, 201);
});
