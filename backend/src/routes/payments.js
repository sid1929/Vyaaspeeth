const crypto = require("crypto");
const { Router } = require("express");
const schemas = require("../schemas");
const { requireAuth } = require("../middleware/auth");
const { publicBooking } = require("../serializers");
const { HttpError } = require("../errors");
const logger = require("../logger");

const sign = (secret, timestamp, rawBody) =>
  crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

function safeEqualHex(a, b) {
  const x = Buffer.from(String(a), "utf8");
  const y = Buffer.from(String(b), "utf8");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = function paymentsRouter({ models, config, limiters }) {
  const { Booking } = models;

  /**
   * Single entry point for payment events: verifies the HMAC signature and timestamp, validates the
   * payload, then applies an atomic state transition. Used by the public webhook AND by the demo gateway.
   */
  async function handleSignedEvent(rawBody, timestamp, signature) {
    const ts = Number(timestamp);
    const nowSec = Math.floor(config.now().getTime() / 1000);
    if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > config.webhookToleranceSeconds) {
      logger.security("webhook_stale_timestamp");
      throw new HttpError(401, "Invalid or expired signature timestamp");
    }
    if (!signature || !safeEqualHex(signature, sign(config.paymentSecret, timestamp, rawBody))) {
      logger.security("webhook_bad_signature");
      throw new HttpError(401, "Invalid signature");
    }
    let parsed;
    try { parsed = JSON.parse(rawBody); } catch { throw new HttpError(400, "Invalid JSON"); }
    const evt = schemas.webhookEvent.parse(parsed);
    const { bookingReference, amount, providerRef } = evt.data;

    if (evt.type === "payment.failed") {
      await Booking.findOneAndUpdate({ bookingReference, status: "Pending" }, { $set: { paymentStatus: "Failed" } }, { new: true });
      return { outcome: "failed_recorded" };
    }

    // Atomic: only a Pending, unexpired booking whose total EXACTLY equals the paid amount can be confirmed.
    const updated = await Booking.findOneAndUpdate(
      { bookingReference, status: "Pending", total: amount, expiresAt: { $gt: config.now() } },
      { $set: { status: "Confirmed", paymentStatus: "Completed", paidAt: config.now(), paymentProviderRef: providerRef, paymentMethod: evt.data.method } },
      { new: true },
    );
    if (updated) {
      await models.SeatLock.updateMany({ bookingReference }, { $set: { status: "sold", expiresAt: null } }); // seats are now permanently sold
      return { outcome: "confirmed", booking: updated };
    }

    const existing = await Booking.findOne({ bookingReference }).lean();
    if (!existing) throw new HttpError(404, "Unknown booking");
    if (existing.paymentStatus === "Completed") return { outcome: "duplicate", booking: existing }; // idempotent replay
    if (existing.total !== amount) {
      logger.security("payment_amount_mismatch", { bookingReference });
      throw new HttpError(400, "Amount mismatch");
    }
    throw new HttpError(409, "Booking is not payable (expired or cancelled)");
  }

  const webhook = async (req, res, next) => {
    try {
      const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
      const result = await handleSignedEvent(raw, req.get("x-vyaas-timestamp"), req.get("x-vyaas-signature"));
      res.json({ received: true, outcome: result.outcome });
    } catch (err) { next(err); }
  };

  const demo = Router();
  demo.use(requireAuth({ models, config }));
  // Demo gateway: plays the role of the payment provider by sending a correctly SIGNED event through
  // the exact same verification path as the real webhook. No real money is ever involved.
  demo.post("/mock-checkout", limiters.booking, async (req, res, next) => {
    try {
      if (!config.enableMockPayments) return res.status(404).json({ message: "Not found" });
      const input = schemas.pay.parse(req.body);
      const booking = await Booking.findOne({ bookingReference: input.bookingReference, user: req.user.id }).lean();
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (booking.status !== "Pending") return res.status(409).json({ message: `Booking is ${booking.status.toLowerCase()}` });
      const payload = JSON.stringify({
        id: `evt_${crypto.randomBytes(8).toString("hex")}`,
        type: input.simulate === "fail" ? "payment.failed" : "payment.succeeded",
        data: { bookingReference: booking.bookingReference, amount: booking.total, providerRef: `demo_${crypto.randomBytes(6).toString("hex")}`, method: input.method },
      });
      const ts = String(Math.floor(config.now().getTime() / 1000));
      const result = await handleSignedEvent(payload, ts, sign(config.paymentSecret, ts, payload));
      const fresh = await Booking.findOne({ bookingReference: booking.bookingReference, user: req.user.id }).lean();
      res.json({ outcome: result.outcome, booking: publicBooking(fresh) });
    } catch (err) { next(err); }
  });

  return { webhook, demo, sign };
};
