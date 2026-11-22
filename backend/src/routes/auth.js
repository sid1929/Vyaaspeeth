const { Router } = require("express");
const bcrypt = require("bcryptjs");
const schemas = require("../schemas");
const { signToken, requireAuth } = require("../middleware/auth");
const logger = require("../logger");

const publicUser = (u) => ({ id: String(u._id), name: u.name, email: u.email });

module.exports = function authRouter({ models, config, limiters }) {
  const r = Router();
  const auth = requireAuth({ models, config });
  // Compared against when the account does not exist so response time does not reveal valid emails.
  const dummyHash = bcrypt.hashSync("not-a-real-password", config.bcryptRounds);

  r.post("/signup", limiters.auth, async (req, res, next) => {
    try {
      const { name, email, password } = schemas.signup.parse(req.body);
      if (await models.User.findOne({ email })) {
        return res.status(409).json({ message: "An account already exists with this email" });
      }
      const hash = await bcrypt.hash(password, config.bcryptRounds);
      let user;
      try {
        user = await models.User.create({ name, email, password: hash });
      } catch (e) {
        if (e.code === 11000) return res.status(409).json({ message: "An account already exists with this email" });
        throw e;
      }
      res.status(201).json({ message: "Account created", token: signToken(user, config), user: publicUser(user) });
    } catch (err) { next(err); }
  });

  r.post("/login", limiters.auth, limiters.loginFailures, async (req, res, next) => {
    try {
      const { email, password } = schemas.login.parse(req.body);
      const user = await models.User.findOne({ email }).select("+password");
      const ok = await bcrypt.compare(password, user ? user.password : dummyHash);
      if (!user || !ok) {
        logger.security("login_failed", { ip: req.ip });
        return res.status(401).json({ message: "Invalid email or password" });
      }
      res.json({ message: "Login successful", token: signToken(user, config), user: publicUser(user) });
    } catch (err) { next(err); }
  });

  r.get("/me", auth, (req, res) => res.json({ user: req.user }));

  // Logout everywhere: bumping tokenVersion invalidates every outstanding token for this user.
  r.post("/logout", auth, async (req, res, next) => {
    try {
      await models.User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
      res.json({ message: "Signed out" });
    } catch (err) { next(err); }
  });

  return r;
};
