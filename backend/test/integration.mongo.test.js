// Runs only when MONGODB_TEST_URI is set (e.g. `mongodb://127.0.0.1:27017/vy_test`). CI provides a Mongo service.
// Verifies the REAL Mongoose models and the UNIQUE seat index, which the in-memory tests can only simulate.
const test = require("node:test");
const assert = require("node:assert");
process.env.NODE_ENV = "test";
const uri = process.env.MONGODB_TEST_URI;

test("MongoDB integration: booking, payment, double-booking protection", { skip: !uri && "MONGODB_TEST_URI not set" }, async () => {
  const mongoose = require("mongoose");
  const request = require("supertest");
  const { loadConfig } = require("../src/config");
  const { createApp } = require("../src/app");
  const { baselineSold, allSeatIds, seatTier } = require("../src/seats");
  const catalog = require("../data/events.json");

  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  const models = require("../src/models");
  await Promise.all(Object.values(models).map((m) => m.init()));
  const config = { ...loadConfig({ NODE_ENV: "test", JWT_SECRET: "j".repeat(40), PAYMENT_WEBHOOK_SECRET: "p".repeat(40) }), bcryptRounds: 4 };
  const api = request(createApp({ models, config }));
  try {
    const signup = async (n) => {
      const r = await api.post("/api/signup").send({ name: "User " + n, email: `u${n}@example.test`, password: "Passw0rd123" });
      assert.strictEqual(r.status, 201);
      return { Authorization: `Bearer ${r.body.token}` };
    };
    const a = await signup(1), b = await signup(2);
    const ev = catalog.find((e) => e.id === "2");
    const free = allSeatIds(ev).filter((id) => seatTier(ev, id) === "Standard" && !baselineSold("2", id));
    const attendee = { fullName: "Asha Rao" };
    const book = (auth, seats) => api.post("/api/bookings").set(auth).send({ eventId: "2", seats, attendee });

    // the same seat requested at the same moment by two users: exactly one wins
    const [r1, r2] = await Promise.all([book(a, [free[0], free[1]]), book(b, [free[1], free[2]])]);
    assert.deepStrictEqual([r1.status, r2.status].sort(), [201, 409]);
    assert.strictEqual(await models.Booking.countDocuments(), 1);
    // the loser's non-conflicting seat must have been rolled back
    const loserSeats = r1.status === 409 ? [free[0], free[1]] : [free[1], free[2]];
    const winner = r1.status === 201 ? r1 : r2, winAuth = r1.status === 201 ? a : b;
    assert.strictEqual(await models.SeatLock.countDocuments({ eventId: "2" }), 2);

    // pay -> seats become sold; booking confirmed
    const ref = winner.body.booking.bookingReference;
    const paid = await api.post("/api/payments/mock-checkout").set(winAuth).send({ bookingReference: ref, method: "UPI" });
    assert.strictEqual(paid.body.booking.status, "Confirmed");
    assert.strictEqual(await models.SeatLock.countDocuments({ eventId: "2", status: "sold" }), 2);
    const seatsRes = await api.get("/api/events/2/seats");
    assert.ok(seatsRes.body.taken.includes(winner.body.booking.seats[0].seat));

    // cancel -> seats released and re-bookable
    await api.post(`/api/bookings/${ref}/cancel`).set(winAuth);
    assert.strictEqual(await models.SeatLock.countDocuments({ eventId: "2" }), 0);
    assert.strictEqual((await book(winAuth === a ? b : a, loserSeats)).status, 201);

    // IDOR on the real DB
    assert.strictEqual((await api.get(`/api/bookings/${ref}`).set(winAuth === a ? b : a)).status, 404);
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
