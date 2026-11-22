const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const tooMany = (message) => (_req, res) => res.status(429).json({ message });
const base = { standardHeaders: "draft-7", legacyHeaders: false };

function createLimiters(limits) {
  const make = (cfg, message, extra = {}) => rateLimit({ ...base, ...cfg, handler: tooMany(message), ...extra });
  return {
    api: make(limits.api, "Too many requests. Please slow down."),
    auth: make(limits.auth, "Too many attempts. Please try again later."),
    // Keyed by IP + submitted email so a guessing attack on one account is throttled even if the
    // account does not exist (no enumeration), and one user's mistakes do not lock out others.
    loginFailures: make(limits.loginFailures, "Too many failed sign-in attempts. Please try again in 15 minutes.", {
      skipSuccessfulRequests: true,
      keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${String(req.body?.email ?? "").toLowerCase().slice(0, 254)}`,
    }),
    booking: make(limits.booking, "Booking limit reached. Please try again later.", {
      keyGenerator: (req) => `u:${req.user?.id ?? ipKeyGenerator(req.ip)}`,
    }),
    messages: make(limits.messages, "You have sent too many messages. Please try again later."),
  };
}
module.exports = { createLimiters };
