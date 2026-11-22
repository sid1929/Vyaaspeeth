const crypto = require("crypto");
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no 0/O/1/I confusion

// Cryptographically random, so references cannot be guessed or enumerated (unlike Date.now()+Math.random()).
function newBookingReference() {
  const bytes = crypto.randomBytes(10);
  let out = "";
  for (const b of bytes) out += ALPHABET[b & 31];
  return `VYS-${out}`;
}
module.exports = { newBookingReference };
