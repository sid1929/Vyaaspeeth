// Seat-map helpers shared by the quote engine and the seats endpoint.
const SEAT_RE = /^([A-Z])([0-9]{1,2})$/;

function parseSeat(id) {
  const m = SEAT_RE.exec(id);
  return m ? { row: m[1], col: Number(m[2]) } : null;
}

function tierOfRow(hall, row) {
  for (const [tier, rows] of Object.entries(hall.tiers)) if (rows.includes(row)) return tier;
  return null;
}

/** Returns the tier for a seat id, or null when the seat does not exist in this hall. */
function seatTier(event, id) {
  const p = parseSeat(id);
  if (!p || p.col < 1 || p.col > event.hall.cols) return null;
  return tierOfRow(event.hall, p.row);
}

// Deterministic "already booked" seats so every hall looks lively and the same on every request.
function baselineSold(eventId, seat) {
  let h = 2166136261;
  for (const ch of `${eventId}:${seat}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h % 100 < 22;
}

function allSeatIds(event) {
  const out = [];
  for (const rows of Object.values(event.hall.tiers)) for (const r of rows) for (let c = 1; c <= event.hall.cols; c++) out.push(`${r}${c}`);
  return out;
}

module.exports = { parseSeat, seatTier, baselineSold, allSeatIds, SEAT_RE };
