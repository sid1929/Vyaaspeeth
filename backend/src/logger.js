// Minimal structured logging. Never pass passwords, tokens, emails, phone numbers or request bodies here.
function log(level, event, meta = {}) {
  if (process.env.NODE_ENV === "test") return;
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...meta });
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}
module.exports = {
  info: (e, m) => log("info", e, m),
  warn: (e, m) => log("warn", e, m),
  error: (e, m) => log("error", e, m),
  security: (e, m) => log("warn", `security.${e}`, m),
};
