const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  bookingReference: { type: String, required: true, unique: true },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  eventStartsAt: { type: Date, required: true },
  seats: {
    type: [new mongoose.Schema({
      seat: { type: String, required: true },
      tier: { type: String, enum: ["Premium", "Standard", "Economy"], required: true },
      price: { type: Number, required: true },
    }, { _id: false })],
    validate: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 10,
  },
  quantity: { type: Number, required: true, min: 1, max: 10 },
  subtotal: { type: Number, required: true },
  serviceFee: { type: Number, required: true },
  total: { type: Number, required: true },
  fullName: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, trim: true, maxlength: 20 },
  // A booking is a HOLD until a verified payment event arrives. Nothing client-side can confirm it.
  status: { type: String, enum: ["Pending", "Confirmed", "Cancelled", "Expired"], default: "Pending" },
  paymentStatus: { type: String, enum: ["Pending", "Completed", "Failed", "Refunded"], default: "Pending" },
  paymentMethod: { type: String, enum: ["Credit Card", "Debit Card", "UPI", "Net Banking", "Wallet"] },
  paymentProviderRef: { type: String },
  paidAt: { type: Date },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
