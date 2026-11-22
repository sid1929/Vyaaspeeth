const test = require("node:test");
const assert = require("node:assert");
const { makeHarness } = require("./helpers/harness");
const { baselineSold, allSeatIds, seatTier } = require("../src/seats");
const catalog = require("../data/events.json");

const ev = (id) => catalog.find((e) => e.id === id);
const priceOf = (eventId, tier) => ev(eventId).tiers.find((t) => t.name === tier).price;
const seatsEndpoint = async (h, id = "2") => (await h.api.get(`/api/events/${id}/seats`)).body;

test("booking requires authentication", async () => {
  const h = makeHarness();
  assert.strictEqual((await h.api.post("/api/bookings").send(h.bookingInput())).status, 401);
});

test("seat -> tier -> price is computed by the server; booking starts as a Pending hold", async () => {
  const h = makeHarness();
  const u = await h.signup();
  const [a] = h.pickSeats("2", 1, "Premium");
  const [b] = h.pickSeats("2", 1, "Standard");
  const res = await h.book(u, { seats: [a, b] });
  assert.strictEqual(res.status, 201);
  const bk = res.body.booking;
  assert.deepStrictEqual(bk.seats.map((s) => [s.seat, s.tier, s.price]), [[a, "Premium", priceOf("2", "Premium")], [b, "Standard", priceOf("2", "Standard")]]);
  assert.strictEqual(bk.subtotal, priceOf("2", "Premium") + priceOf("2", "Standard"));
  assert.strictEqual(bk.total, bk.subtotal + 50);
  assert.strictEqual(bk.quantity, 2);
  assert.strictEqual(bk.status, "Pending");
  assert.strictEqual(bk.paymentStatus, "Pending");
  assert.match(bk.bookingReference, /^VYS-[A-Z0-9]{10}$/);
});

test("client-supplied prices, totals, tiers, status or user ids are rejected (parameter tampering)", async () => {
  const h = makeHarness();
  const u = await h.signup();
  for (const extra of [{ unitPrice: 1 }, { total: 1 }, { ticketType: "Economy" }, { quantity: 1 }, { status: "Confirmed" }, { paymentStatus: "Completed" }, { user: "1".repeat(24) }]) {
    assert.strictEqual((await h.book(u, extra)).status, 400, JSON.stringify(extra));
  }
  assert.strictEqual(h.models.Booking.docs.length, 0);
  assert.strictEqual(h.models.SeatLock.docs.length, 0);
});

test("invalid seat requests are refused: none, too many, duplicates, malformed, outside the hall, unknown event", async () => {
  const h = makeHarness();
  const u = await h.signup();
  assert.strictEqual((await h.book(u, { seats: [] })).status, 400);
  assert.strictEqual((await h.book(u, { seats: allSeatIds(ev("2")).slice(0, 11) })).status, 400);
  const [s] = h.pickSeats("2", 1);
  assert.strictEqual((await h.book(u, { seats: [s, s] })).status, 400);
  assert.strictEqual((await h.book(u, { seats: ["a1"] })).status, 400);
  assert.strictEqual((await h.book(u, { seats: [{ $ne: null }] })).status, 400);
  assert.strictEqual((await h.book(u, { seats: ["Z1"] })).status, 400); // row not in hall
  assert.strictEqual((await h.book(u, { seats: ["A99"] })).status, 400); // column not in hall
  assert.strictEqual((await h.book(u, { eventId: "999", seats: [s] })).status, 400);
});

test("pre-sold seats and sold-out tiers cannot be booked", async () => {
  const h = makeHarness();
  const u = await h.signup();
  const sold = allSeatIds(ev("2")).find((id) => baselineSold("2", id));
  const res = await h.book(u, { seats: [sold] });
  assert.strictEqual(res.status, 409);
  assert.deepStrictEqual(res.body.seats, [sold]);
  const economy1 = allSeatIds(ev("1")).find((id) => seatTier(ev("1"), id) === "Economy" && !baselineSold("1", id));
  assert.strictEqual((await h.book(u, { eventId: "1", seats: [economy1] })).status, 409); // Economy sold out in catalog
});

test("past events cannot be booked", async () => {
  const late = makeHarness({ now: () => new Date("2030-01-01T00:00:00Z") });
  const u = await late.signup();
  assert.strictEqual((await late.book(u)).status, 409);
});

test("DOUBLE BOOKING: a seat held by one user cannot be taken by another, and partial locks are rolled back", async () => {
  const h = makeHarness();
  const alice = await h.signup("Alice A");
  const bob = await h.signup("Bob B");
  const [s1, s2, s3] = h.pickSeats("2", 3);
  assert.strictEqual((await h.book(alice, { seats: [s1] })).status, 201);

  const clash = await h.book(bob, { seats: [s2, s1, s3] }); // s2 is free, s1 is Alice's
  assert.strictEqual(clash.status, 409);
  assert.deepStrictEqual(clash.body.seats, [s1]);
  const taken = (await seatsEndpoint(h)).taken;
  assert.ok(taken.includes(s1));
  assert.ok(!taken.includes(s2) && !taken.includes(s3), "free seats must not stay locked after a failed attempt");
  assert.strictEqual((await h.book(bob, { seats: [s2, s3] })).status, 201);
});

test("DOUBLE BOOKING: two simultaneous requests for the same seat produce exactly one booking", async () => {
  const h = makeHarness();
  const a = await h.signup(), b = await h.signup();
  const [seat] = h.pickSeats("2", 1);
  const [r1, r2] = await Promise.all([h.book(a, { seats: [seat] }), h.book(b, { seats: [seat] })]);
  assert.deepStrictEqual([r1.status, r2.status].sort(), [201, 409]);
  assert.strictEqual(h.models.Booking.docs.length, 1);
});

test("seat availability: held seats appear as taken and are freed on cancel", async () => {
  const h = makeHarness();
  const u = await h.signup();
  const seats = h.pickSeats("2", 2);
  const ref = (await h.book(u, { seats })).body.booking.bookingReference;
  const t1 = (await seatsEndpoint(h)).taken;
  seats.forEach((s) => assert.ok(t1.includes(s)));
  await h.api.post(`/api/bookings/${ref}/cancel`).set(u.auth);
  const t2 = (await seatsEndpoint(h)).taken;
  seats.forEach((s) => assert.ok(!t2.includes(s)));
  assert.strictEqual((await h.api.get("/api/events/999/seats")).status, 404);
});

test("users can only see and cancel their own bookings (IDOR protection)", async () => {
  const h = makeHarness();
  const alice = await h.signup("Alice A");
  const bob = await h.signup("Bob B");
  const ref = (await h.book(alice)).body.booking.bookingReference;
  assert.strictEqual((await h.api.get(`/api/bookings/${ref}`).set(alice.auth)).status, 200);
  assert.strictEqual((await h.api.get(`/api/bookings/${ref}`).set(bob.auth)).status, 404);
  assert.strictEqual((await h.api.post(`/api/bookings/${ref}/cancel`).set(bob.auth)).status, 404);
  assert.strictEqual((await h.api.get("/api/bookings").set(bob.auth)).body.bookings.length, 0);
  assert.strictEqual((await h.api.get("/api/bookings").set(alice.auth)).body.bookings.length, 1);
  assert.strictEqual((await h.api.get("/api/bookings/not-a-ref").set(bob.auth)).status, 404);
  assert.strictEqual((await h.api.post("/api/payments/mock-checkout").set(bob.auth).send({ bookingReference: ref, method: "UPI" })).status, 404);
});

test("pending holds can be cancelled; cancelled bookings cannot be paid", async () => {
  const h = makeHarness();
  const u = await h.signup();
  const ref = (await h.book(u)).body.booking.bookingReference;
  const cancel = await h.api.post(`/api/bookings/${ref}/cancel`).set(u.auth);
  assert.strictEqual(cancel.status, 200);
  assert.strictEqual(cancel.body.booking.status, "Cancelled");
  assert.strictEqual((await h.api.post("/api/payments/mock-checkout").set(u.auth).send({ bookingReference: ref, method: "UPI" })).status, 409);
  assert.strictEqual((await h.api.post(`/api/bookings/${ref}/cancel`).set(u.auth)).status, 409);
});

test("unpaid holds expire and their seats are released for other people", async () => {
  let now = new Date("2026-11-21T10:00:00Z");
  const h = makeHarness({ now: () => now });
  const a = await h.signup(), b = await h.signup();
  const seats = h.pickSeats("2", 2);
  const ref = (await h.book(a, { seats })).body.booking.bookingReference;
  assert.strictEqual((await h.book(b, { seats })).status, 409); // still held
  now = new Date("2026-11-21T10:20:00Z"); // hold is 15 minutes
  assert.strictEqual((await h.api.get(`/api/bookings/${ref}`).set(a.auth)).body.booking.status, "Expired");
  assert.strictEqual((await h.api.post("/api/payments/mock-checkout").set(a.auth).send({ bookingReference: ref, method: "UPI" })).status, 409);
  assert.strictEqual((await h.book(b, { seats })).status, 201); // seats are free again
});

test("booking creation is rate limited per user", async () => {
  const h = makeHarness({ limits: { booking: { windowMs: 60_000, limit: 2 } } });
  const u = await h.signup();
  assert.strictEqual((await h.book(u)).status, 201);
  assert.strictEqual((await h.book(u)).status, 201);
  assert.strictEqual((await h.book(u)).status, 429);
});
