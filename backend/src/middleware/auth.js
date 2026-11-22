const jwt = require("jsonwebtoken");

function signToken(user, config) {
  return jwt.sign({ sub: String(user._id), tv: user.tokenVersion ?? 0 }, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: config.jwtExpiresIn,
  });
}

function requireAuth({ models, config }) {
  return async (req, res, next) => {
    try {
      const header = req.get("authorization") || "";
      const [scheme, token] = header.split(" ");
      if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "Authentication required" });
      let payload;
      try {
        // Pin the algorithm so "alg: none" and algorithm-confusion tokens are rejected.
        payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
      } catch {
        return res.status(401).json({ message: "Session expired or invalid. Please sign in again." });
      }
      const user = await models.User.findById(payload.sub);
      // Server-side check: logout bumps tokenVersion, instantly invalidating old tokens.
      if (!user || (user.tokenVersion ?? 0) !== payload.tv) {
        return res.status(401).json({ message: "Session expired or invalid. Please sign in again." });
      }
      req.user = { id: String(user._id), name: user.name, email: user.email };
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { signToken, requireAuth };
