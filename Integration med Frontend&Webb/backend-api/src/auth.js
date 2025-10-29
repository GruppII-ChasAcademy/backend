const jwt = require("jsonwebtoken");

// OBS: Byt i Azure App Settings -> JWT_SECRET (annars denna default)
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-prod";

// Enkel "databas" i minnet
const usersDb = new Map();

function nowIso() {
  return new Date().toISOString();
}

// Seed admin-user direkt
(function seedAdmin() {
  const id = "admin-1";
  if (!usersDb.has(id)) {
    usersDb.set(id, {
      id,
      name: "Admin",
      email: "admin@example.com",
      passwordHash: "admin123", // plaintext DEMO ONLY
      role: "admin",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }
})();

function cryptoRandomId() {
  return "id-" + Math.random().toString(36).substring(2, 10);
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role || "user",
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
}

// ============ Middleware ============

function verifyJWT(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) {
    return res.status(401).json({ error: "missing_auth_header" });
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "invalid_auth_header" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { sub, role, email, iat, exp }
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: "invalid_token", message: err.message });
  }
}

function requireRole(roleName) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== roleName) {
      return res
        .status(403)
        .json({ error: "forbidden", need: roleName });
    }
    next();
  };
}

// ============ Hjälpfunktioner för användare/auth ============

function getUserById(id) {
  const u = usersDb.get(id);
  if (!u) return null;
  const { passwordHash, ...safe } = u;
  return safe;
}

function listUsers() {
  const out = [];
  for (const u of usersDb.values()) {
    const { passwordHash, ...safe } = u;
    out.push(safe);
  }
  return out;
}

function createUser({ name, email, password, role = "user" }) {
  // Kolla så email inte redan finns
  for (const u of usersDb.values()) {
    if (u.email === email) {
      const err = new Error("email_already_exists");
      throw err;
    }
  }

  const id = cryptoRandomId();
  const ts = nowIso();

  const user = {
    id,
    name,
    email,
    passwordHash: password, // plaintext DEMO ONLY
    role,
    createdAt: ts,
    updatedAt: ts,
  };

  usersDb.set(id, user);

  const { passwordHash, ...safe } = user;
  return safe;
}

function loginUser({ email, password }) {
  let found = null;
  for (const u of usersDb.values()) {
    if (u.email === email) {
      found = u;
      break;
    }
  }

  if (!found || found.passwordHash !== password) {
    const err = new Error("invalid_credentials");
    throw err;
  }

  const token = signToken(found);

  return {
    token,
    user: {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    },
  };
}

function deleteUserById(requester, targetId) {
  if (!usersDb.has(targetId)) {
    return { ok: false, error: "not_found" };
  }

  // Admin får ta bort alla
  // Vanlig user får bara ta bort sig själv
  if (requester.role !== "admin" && requester.sub !== targetId) {
    return { ok: false, error: "forbidden" };
  }

  usersDb.delete(targetId);
  return { ok: true };
}

module.exports = {
  verifyJWT,
  requireRole,
  getUserById,
  listUsers,
  createUser,
  loginUser,
  deleteUserById,
};
