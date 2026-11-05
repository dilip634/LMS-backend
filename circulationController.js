const Circulation = require('../models/Circulation');
const Book = require('../models/Book');
const User = require('../models/User');
const Reservation = require('../models/Reservation');

const MAX_BOOKS_PER_PATRON = 5;
const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 20;

// POST /api/circulation/checkout
exports.checkOut = async (req, res, next) => {
  try {
    const { bookId, patronId } = req.body;

    const [book, patron] = await Promise.all([
      Book.findById(bookId),
      User.findById(patronId),
    ]);

    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    if (!patron || patron.role !== 'patron') {
      return res.status(404).json({ success: false, message: 'Patron not found' });
    }
    if (book.availableCopies < 1) {
      return res.status(409).json({ success: false, message: 'No copies available' });
    }

    const unpaidFines = await Circulation.findOne({
      patron: patronId,
      'fine.amount': { $gt: 0 },
      'fine.paid': false,
      status: 'returned',
    });

    if (unpaidFines) {
      return res.status(409).json({
        success: false,
        message: 'Patron has unpaid fines. Please clear dues before checking out.',
      });
    }

    const activeLoans = await Circulation.countDocuments({
      patron: patronId,
      status: { $in: ['active', 'overdue'] },
    });

    if (activeLoans >= MAX_BOOKS_PER_PATRON) {
      return res.status(409).json({
        success: false,
        message: `Patron has reached the maximum limit of ${MAX_BOOKS_PER_PATRON} books`,
      });
    }

    const existing = await Circulation.findOne({
      book: bookId,
      patron: patronId,
      status: { $in: ['active', 'overdue'] },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Patron already has this book' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const loan = await Circulation.create({
      book: bookId, patron: patronId, issuedBy: req.user._id, dueDate,
    });

    book.availableCopies -= 1;
    await book.save();

    await Reservation.findOneAndUpdate(
      { book: bookId, patron: patronId, status: 'pending' },
      { status: 'fulfilled' }
    );

    await loan.populate([
      { path: 'book', select: 'title author isbn' },
      { path: 'patron', select: 'name email membershipId' },
      { path: 'issuedBy', select: 'name' },
    ]);

    res.status(201).json({ success: true, data: loan });
  } catch (err) {
    next(err);
  }
};

// POST /api/circulation/checkin
exports.checkIn = async (req, res, next) => {
  try {
    const { loanId } = req.body;

    const loan = await Circulation.findById(loanId).populate('book patron');

    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.status === 'returned') {
      return res.status(409).json({ success: false, message: 'Book already returned' });
    }

    const now = new Date();
    loan.returnedAt = now;
    loan.returnedTo = req.user._id;
    loan.status = 'returned';

    if (now > loan.dueDate) {
      const daysLate = Math.ceil((now - loan.dueDate) / (1000 * 60 * 60 * 24));
      loan.fine.amount = daysLate * FINE_PER_DAY;
    }

    await loan.save();

    loan.book.availableCopies += 1;
    await loan.book.save();

    res.json({
      success: true,
      data: loan,
      message: loan.fine.amount > 0
        ? `Book returned with a fine of ₹${loan.fine.amount}`
        : 'Book returned successfully',
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/circulation/fine/:loanId/pay
exports.payFine = async (req, res, next) => {
  try {
    const loan = await Circulation.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.fine.amount === 0) {
      return res.status(400).json({ success: false, message: 'No fine on this loan' });
    }
    if (loan.fine.paid) {
      return res.status(409).json({ success: false, message: 'Fine already paid' });
    }

    loan.fine.paid = true;
    loan.fine.paidAt = new Date();
    await loan.save();

    res.json({ success: true, message: `Fine of ₹${loan.fine.amount} marked as paid`, data: loan });
  } catch (err) {
    next(err);
  }
};

// GET /api/circulation/overdue
exports.getOverdue = async (req, res, next) => {
  try {
    await Circulation.updateMany(
      { status: 'active', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const overdue = await Circulation.find({ status: 'overdue' })
      .populate('book', 'title author isbn')
      .populate('patron', 'name email membershipId phone')
      .sort({ dueDate: 1 });

    const enriched = overdue.map((loan) => ({
      ...loan.toJSON(),
      daysLate: Math.ceil((new Date() - loan.dueDate) / (1000 * 60 * 60 * 24)),
      computedFine: loan.computedFine,
    }));

    res.json({ success: true, total: enriched.length, data: enriched });
  } catch (err) {
    next(err);
  }
};

// GET /api/circulation/history/:patronId
exports.getPatronHistory = async (req, res, next) => {
  try {
    const { patronId } = req.params;

    if (req.user.role === 'patron' && req.user._id.toString() !== patronId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const loans = await Circulation.find({ patron: patronId })
      .populate('book', 'title author isbn genre')
      .sort({ checkedOutAt: -1 });

    res.json({ success: true, total: loans.length, data: loans });
  } catch (err) {
    next(err);
  }
};

// GET /api/circulation/active
exports.getActiveLoans = async (req, res, next) => {
  try {
    const loans = await Circulation.find({ status: { $in: ['active', 'overdue'] } })
      .populate('book', 'title author isbn')
      .populate('patron', 'name email membershipId')
      .sort({ dueDate: 1 });

    res.json({ success: true, total: loans.length, data: loans });
  } catch (err) {
    next(err);
  }
};