const events = require("../data/events.json");
const { HttpError } = require("./errors");
const { seatTier, baselineSold, allSeatIds } = require("./seats");

const SERVICE_FEE = 50; // INR per order
const MAX_SEATS = 10;
const byId = new Map(events.map((e) => [e.id, e]));

const listEvents = () => events;
const getEvent = (id) => byId.get(String(id));
const baselineTaken = (event) => allSeatIds(event).filter((s) => baselineSold(event.id, s));

/**
 * The ONLY place prices are decided. A client sends an event id and seat ids; every price, the fee and
 * the total are derived here from trusted catalog data (seat -> row -> tier -> price).
 */
function quote({ eventId, seats }, now = new Date()) {
  const event = getEvent(eventId);
  if (!event) throw new HttpError(404, "Event not found");
  if (new Date(event.startsAt) <= now) throw new HttpError(409, "This event has already started");
  if (!Array.isArray(seats) || seats.length < 1 || seats.length > MAX_SEATS) throw new HttpError(400, `Choose between 1 and ${MAX_SEATS} seats`);
  if (new Set(seats).size !== seats.length) throw new HttpError(400, "Duplicate seats in request");

  const lines = seats.map((seat) => {
    const tier = seatTier(event, seat);
    if (!tier) throw new HttpError(400, `Seat ${seat} does not exist in this hall`);
    const t = event.tiers.find((x) => x.name === tier);
    if (!t || !t.available) throw new HttpError(409, `${tier} seats are sold out`, { seats: [seat] });
    if (baselineSold(event.id, seat)) throw new HttpError(409, `Seat ${seat} is already booked`, { seats: [seat] });
    return { seat, tier, price: t.price };
  });
  const subtotal = lines.reduce((s, l) => s + l.price, 0);
  return { event, lines, subtotal, serviceFee: SERVICE_FEE, total: subtotal + SERVICE_FEE };
}

module.exports = { listEvents, getEvent, quote, baselineTaken, SERVICE_FEE, MAX_SEATS };
