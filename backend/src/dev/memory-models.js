// In-memory stand-in for the Mongoose models (only the operations this API uses).
// Used by the test suite and by `npm run dev:memory` for a zero-setup demo. NOT for production: data is lost on restart.
// It lets the whole HTTP layer be tested without a database. (Real Mongoose behaviour is covered by manual testing.)
const crypto = require("crypto");

const oid = () => crypto.randomBytes(12).toString("hex");
const norm = (v) => (v instanceof Date ? v.getTime() : v && typeof v === "object" && v._bsontype ? String(v) : v);

function matches(doc, filter) {
  return Object.entries(filter).every(([k, cond]) => {
    const val = norm(doc[k]);
    if (cond && typeof cond === "object" && !(cond instanceof Date)) {
      return Object.entries(cond).every(([op, x]) => {
        const c = norm(x);
        if (op === "$gt") return val != null && val > c;
        if (op === "$lt") return val != null && val < c;
        if (op === "$in") return x.map(norm).includes(val);
        throw new Error(`fake: unsupported operator ${op}`);
      });
    }
    return String(val) === String(norm(cond)) && typeof val === typeof norm(cond) || val === norm(cond) || String(val) === String(norm(cond));
  });
}

function applyUpdate(doc, update) {
  for (const [k, v] of Object.entries(update.$set || {})) if (v !== undefined) doc[k] = v;
  for (const [k, v] of Object.entries(update.$inc || {})) doc[k] = (doc[k] || 0) + v;
}

class Query {
  constructor(run) { this.run = run; this._sort = null; }
  sort(s) { this._sort = s; return this; }
  select() { return this; }
  lean() { return this; }
  then(res, rej) {
    return Promise.resolve(this.run()).then((r) => {
      if (this._sort && Array.isArray(r)) {
        const [[k, dir]] = Object.entries(this._sort);
        r = [...r].sort((a, b) => (norm(a[k]) > norm(b[k]) ? 1 : -1) * dir);
      }
      return r;
    }).then(res, rej);
  }
}

function collection(unique = []) {
  const docs = [];
  const specs = unique.map((u) => (Array.isArray(u) ? u : [u]));
  const insertOne = (data) => {
    for (const fields of specs) {
      if (docs.some((d) => fields.every((f) => String(d[f]) === String(data[f])))) throw Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    }
    const now = new Date();
    const doc = { _id: oid(), createdAt: now, updatedAt: now, ...data };
    docs.push(doc);
    return { ...doc };
  };
  return {
    docs,
    async create(data) { return insertOne(data); },
    // ordered insert: earlier docs stay inserted when a later one violates a unique index (like MongoDB)
    async insertMany(list) { return list.map(insertOne); },
    async deleteMany(f) { for (let i = docs.length - 1; i >= 0; i--) if (matches(docs[i], f)) docs.splice(i, 1); },
    findOne: (f) => new Query(() => { const d = docs.find((x) => matches(x, f)); return d ? { ...d } : null; }),
    findById(id) { return this.findOne({ _id: id }); },
    find: (f) => new Query(() => docs.filter((x) => matches(x, f)).map((d) => ({ ...d }))),
    async findOneAndUpdate(f, update) {
      const d = docs.find((x) => matches(x, f));
      if (!d) return null;
      applyUpdate(d, update); d.updatedAt = new Date();
      return { ...d };
    },
    async updateOne(f, update) { const d = docs.find((x) => matches(x, f)); if (d) applyUpdate(d, update); },
    async updateMany(f, update) { docs.filter((x) => matches(x, f)).forEach((d) => applyUpdate(d, update)); },
  };
}

const createFakeModels = () => ({
  User: collection(["email"]),
  Booking: collection(["bookingReference"]),
  SeatLock: collection([["eventId", "seat"]]),
  Message: collection(),
});
module.exports = { createFakeModels };
