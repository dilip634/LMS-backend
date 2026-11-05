const Reservation = require('../models/Reservation');
const Book = require('../models/Book');

// POST /api/reservations  — patron
exports.createReservation = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    const patronId = req.user._id;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    if (book.availableCopies > 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is available — please check out directly',
      });
    }

    const existing = await Reservation.findOne({ book: bookId, patron: patronId, status: 'pending' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Reservation already exists' });
    }

    const reservation = await Reservation.create({ book: bookId, patron: patronId });
    await reservation.populate('book', 'title author');

    res.status(201).json({ success: true, data: reservation });
  } catch (err) {
    next(err);
  }
};

// GET /api/reservations/my
exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ patron: req.user._id })
      .populate('book', 'title author isbn genre')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reservations });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reservations/:id  — cancel
exports.cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });

    const isOwner = reservation.patron.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'librarian') {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    reservation.status = 'cancelled';
    await reservation.save();
    res.json({ success: true, message: 'Reservation cancelled' });
  } catch (err) {
    next(err);
  }
};
