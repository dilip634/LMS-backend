const { validationResult } = require('express-validator');
const Book = require('../models/Book');

// GET /api/books  — list with search & filters
exports.getBooks = async (req, res, next) => {
  try {
    const { q, genre, author, available, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (q) {
      filter.$text = { $search: q };
    }
    if (genre) filter.genre = genre;
    if (author) filter.author = new RegExp(author, 'i');
    if (available === 'true') filter.availableCopies = { $gt: 0 };

    const skip = (Number(page) - 1) * Number(limit);

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('addedBy', 'name'),
      Book.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: books,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/:id
exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate('addedBy', 'name');
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// POST /api/books  — librarian only
exports.createBook = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const book = await Book.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/books/:id  — librarian only
exports.updateBook = async (req, res, next) => {
  try {
    // Don't allow direct availableCopies edit via this route
    const { availableCopies, ...updates } = req.body;

    const book = await Book.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/books/:id  — librarian only
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    if (book.availableCopies < book.totalCopies) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete a book with active loans',
      });
    }

    await book.deleteOne();
    res.json({ success: true, message: 'Book removed' });
  } catch (err) {
    next(err);
  }
};
