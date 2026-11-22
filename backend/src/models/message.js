const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  kind: { type: String, enum: ["contact", "feedback"], required: true },
  name: { type: String, required: true, maxlength: 80 },
  email: { type: String, required: true, maxlength: 254 },
  subject: { type: String, maxlength: 120 },
  message: { type: String, required: true, maxlength: 2000 },
  rating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
