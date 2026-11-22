const { Router } = require("express");
const schemas = require("../schemas");

module.exports = function messagesRouter({ models, limiters }) {
  const r = Router();
  r.post("/", limiters.messages, async (req, res, next) => {
    try {
      const data = schemas.message.parse(req.body);
      // Honeypot: bots fill hidden fields. Pretend success so they learn nothing.
      if (data.website) return res.status(201).json({ message: "Thank you! We received your message." });
      const { website, ...doc } = data;
      await models.Message.create(doc);
      res.status(201).json({ message: "Thank you! We received your message." });
    } catch (err) { next(err); }
  });
  return r;
};
