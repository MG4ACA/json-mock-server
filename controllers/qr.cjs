const QRCode = require("qrcode");
const crypto = require("crypto");
const db = require("../db.cjs")();

// Endpoint to generate a QR code for a booked ticket
// POST /qr/generate { bookingId: 123 }
async function generateQr(req, res) {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ error: "bookingId required" });

  // Find the booking
  const booking = db.bookings.find((b) => b.booking_id === bookingId);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  // Generate a secure random token
  const token = crypto.randomUUID();

  // Store the token in the booking
  booking.qrToken = token;

  // Generate QR code as a data URL
  const qrDataUrl = await QRCode.toDataURL(token);

  res.json({ qr: qrDataUrl });
}

// Endpoint to validate a QR code (admin side)
// POST /qr/validate { token: "..." }
function validateQr(req, res) {
  const { token } = req.body;
  const booking = db.bookings.find((b) => b.qrToken === token);
  if (!booking) return res.status(404).json({ valid: false });

  res.json({ valid: true, booking });
}

module.exports = (router) => {
  router.post("/qr/generate", generateQr);
  router.post("/qr/validate", validateQr);
};
