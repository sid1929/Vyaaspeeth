const mongoose = require("mongoose");

// One row per seat that is held or sold. The UNIQUE index on (eventId, seat) is what makes double
// booking impossible even when two people click the same seat at the same millisecond.
const seatLockSchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  seat: { type: String, required: true },
  bookingReference: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["held", "sold"], default: "held" },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });
seatLockSchema.index({ eventId: 1, seat: 1 }, { unique: true });

module.exports = mongoose.models.SeatLock || mongoose.model("SeatLock", seatLockSchema);
