const { Router } = require("express");
const { listEvents, getEvent, baselineTaken, SERVICE_FEE } = require("../catalog");

module.exports = function eventsRouter({ models, config }) {
  const r = Router();
  r.get("/", (_req, res) => res.json({ events: listEvents(), serviceFee: SERVICE_FEE }));
  r.get("/:id", (req, res) => {
    const event = getEvent(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ event, serviceFee: SERVICE_FEE });
  });
  // Live seat availability: baseline-sold seats plus any seat currently held or sold.
  r.get("/:id/seats", async (req, res, next) => {
    try {
      const event = getEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });
      await models.SeatLock.deleteMany({ eventId: event.id, status: "held", expiresAt: { $lt: config.now() } });
      const locks = await models.SeatLock.find({ eventId: event.id }).lean();
      const taken = [...new Set([...baselineTaken(event), ...locks.map((l) => l.seat)])];
      res.json({ eventId: event.id, hall: event.hall, taken, serverTime: config.now().toISOString() });
    } catch (err) { next(err); }
  });
  return r;
};
