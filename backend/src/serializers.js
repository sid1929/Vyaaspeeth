const iso = (d) => (d ? new Date(d).toISOString() : null);

// Explicit allow-list: never serialize a raw document (avoids leaking internal fields by accident).
function publicBooking(b) {
  return {
    bookingReference: b.bookingReference,
    eventId: b.eventId,
    eventTitle: b.eventTitle,
    eventStartsAt: iso(b.eventStartsAt),
    seats: (b.seats || []).map((x) => ({ seat: x.seat, tier: x.tier, price: x.price })),
    quantity: b.quantity,
    subtotal: b.subtotal,
    serviceFee: b.serviceFee,
    total: b.total,
    fullName: b.fullName,
    phone: b.phone || null,
    status: b.status,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod || null,
    paidAt: iso(b.paidAt),
    expiresAt: iso(b.expiresAt),
    createdAt: iso(b.createdAt),
  };
}
module.exports = { publicBooking };
