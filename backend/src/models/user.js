const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  // select:false keeps the hash out of every query unless explicitly requested (login only).
  password: { type: String, required: true, select: false },
  // Incremented on logout: every previously issued token carries the old value and stops working.
  tokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
