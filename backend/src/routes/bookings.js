const { Router } = require("express");
const schemas = require("../schemas");
const { quote, getEvent } = require("../catalog");
const { requireAuth } = require("../middleware/auth");
const { publicBooking } = require("../serializers");
const { newBookingReference } = require("../reference");
const { HttpError } = require("../errors");

module.exports = function bookingsRouter({ models, config, limiters }) {
  const r = Router();
  r.use(requireAuth({ models, config }));
  const { Booking } = models;

  const { SeatLock } = models;

  // Unpaid holds expire: mark the booking Expired and free its seats so others can book them.
  async function expireStale(userId) {
    const stale = await Booking.find({ user: userId, status: "Pending", expiresAt: { $lt: config.now() } }).lean();
    if (!stale.length) return;
    const refs = stale.map((b) => b.bookingReference);
    await Booking.updateMany({ bookingReference: { $in: refs } }, { $set: { status: "Expired" } });
    await SeatLock.deleteMany({ bookingReference: { $in: refs } });
  }

  r.post("/", limiters.booking, async (req, res, next) => {
    try {
      const input = schemas.booking.parse(req.body);
      const now = config.now();
      const q = quote({ eventId: input.eventId, seats: input.seats }, now); // seat -> tier -> price, server only
      const reference = newBookingReference();
      const expiresAt = new Date(now.getTime() + config.holdMinutes * 60_000);

      // 1. free seats whose hold expired, 2. lock the requested seats atomically (UNIQUE index decides the winner)
      await SeatLock.deleteMany({ eventId: q.event.id, status: "held", expiresAt: { $lt: now } });
      try {
        await SeatLock.insertMany(
          input.seats.map((seat) => ({ eventId: q.event.id, seat, bookingReference: reference, user: req.user.id, status: "held", expiresAt })),
          { ordered: true },
        );
      } catch (e) {
        await SeatLock.deleteMany({ bookingReference: reference }); // roll back partial locks
        if (e.code === 11000 || e.writeErrors) {
          const taken = await SeatLock.find({ eventId: q.event.id, seat: { $in: input.seats } }).lean();
          throw new HttpError(409, "Some of those seats were just taken. Please pick different seats.", { seats: taken.map((t) => t.seat) });
        }
        throw e;
      }

      let booking;
      try {
        booking = await Booking.create({
          user: req.user.id, bookingReference: reference,
          eventId: q.event.id, eventTitle: q.event.title, eventStartsAt: new Date(q.event.startsAt),
          seats: q.lines, quantity: q.lines.length, subtotal: q.subtotal, serviceFee: q.serviceFee, total: q.total,
          fullName: input.attendee.fullName, phone: input.attendee.phone,
          status: "Pending", paymentStatus: "Pending", expiresAt,
        });
      } catch (e) {
        await SeatLock.deleteMany({ bookingReference: reference });
        throw e;
      }
      res.status(201).json({ message: "Seats held. Complete payment to confirm.", booking: publicBooking(booking) });
    } catch (err) { next(err); }
  });

  r.get("/", async (req, res, next) => {
    try {
      await expireStale(req.user.id);
      const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
      res.json({ bookings: bookings.map(publicBooking) });
    } catch (err) { next(err); }
  });

  // Ownership is part of the query, so another user's reference is indistinguishable from a missing one (anti-IDOR).
  r.get("/:ref", async (req, res, next) => {
    try {
      if (!schemas.reference.safeParse(req.params.ref).success) return res.status(404).json({ message: "Booking not found" });
      await expireStale(req.user.id);
      const booking = await Booking.findOne({ bookingReference: req.params.ref, user: req.user.id }).lean();
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      res.json({ booking: publicBooking(booking) });
    } catch (err) { next(err); }
  });

  r.post("/:ref/cancel", async (req, res, next) => {
    try {
      if (!schemas.reference.safeParse(req.params.ref).success) return res.status(404).json({ message: "Booking not found" });
      const filter = { bookingReference: req.params.ref, user: req.user.id };
      const booking = await Booking.findOne(filter).lean();
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (!["Pending", "Confirmed"].includes(booking.status)) {
        return res.status(409).json({ message: `A ${booking.status.toLowerCase()} booking cannot be cancelled` });
      }
      const hoursLeft = (new Date(booking.eventStartsAt) - config.now()) / 3_600_000;
      if (booking.status === "Confirmed" && hoursLeft < config.cancelWindowHours) {
        return res.status(409).json({ message: `Confirmed bookings can only be cancelled ${config.cancelWindowHours}+ hours before the event` });
      }
      const wasPaid = booking.status === "Confirmed";
      const updated = await Booking.findOneAndUpdate(
        { ...filter, status: booking.status },
        { $set: { status: "Cancelled", paymentStatus: wasPaid ? "Refunded" : booking.paymentStatus } },
        { new: true },
      );
      if (!updated) return res.status(409).json({ message: "Booking changed. Please refresh." });
      await SeatLock.deleteMany({ bookingReference: req.params.ref }); // free the seats
      res.json({ message: wasPaid ? "Booking cancelled. Refund initiated." : "Booking cancelled.", booking: publicBooking(updated) });
    } catch (err) { next(err); }
  });

  return r;
};
