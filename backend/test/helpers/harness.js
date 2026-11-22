process.env.NODE_ENV = "test";
const request = require("supertest");
const { loadConfig } = require("../../src/config");
const { createApp } = require("../../src/app");
const { createFakeModels } = require("../../src/dev/memory-models");
const { baselineSold, allSeatIds, seatTier } = require("../../src/seats");
const catalog = require("../../data/events.json");

const ORIGIN = "http://localhost:3000";

function makeHarness(overrides = {}) {
  const config = {
    ...loadConfig({ NODE_ENV: "test", JWT_SECRET: "j".repeat(40), PAYMENT_WEBHOOK_SECRET: "p".repeat(40), CORS_ORIGINS: ORIGIN }),
    bcryptRounds: 4,
    ...overrides,
    limits: { ...loadConfig({ NODE_ENV: "test", JWT_SECRET: "j".repeat(40), PAYMENT_WEBHOOK_SECRET: "p".repeat(40) }).limits, ...(overrides.limits || {}) },
  };
  const models = createFakeModels();
  const app = createApp({ models, config });
  const api = request(app);
  let counter = 0;

  async function signup(name = "Asha Rao") {
    const email = `user${++counter}@example.test`;
    const res = await api.post("/api/signup").send({ name, email, password: "Passw0rdTest" });
    return { email, token: res.body.token, auth: { Authorization: `Bearer ${res.body.token}` }, res };
  }
  // seats that are genuinely free (not baseline-sold, not already used by this harness) in a given tier
  const used = new Set();
  function pickSeats(eventId = "2", n = 2, tier = "Standard") {
    const ev = catalog.find((e) => e.id === eventId);
    if (!ev) return [];
    const out = allSeatIds(ev).filter((id) => seatTier(ev, id) === tier && !baselineSold(eventId, id) && !used.has(`${eventId}:${id}`)).slice(0, n);
    out.forEach((id) => used.add(`${eventId}:${id}`));
    return out;
  }
  const bookingInput = (o = {}) => ({ eventId: "2", seats: o.seats ?? pickSeats(o.eventId ?? "2", 2), attendee: { fullName: "Asha Rao", phone: "+91 98765 43210" }, ...o });
  async function book(user, o) { return api.post("/api/bookings").set(user.auth).send(bookingInput(o)); }
  return { api, app, config, models, signup, book, bookingInput, pickSeats, ORIGIN };
}
module.exports = { makeHarness, ORIGIN };
