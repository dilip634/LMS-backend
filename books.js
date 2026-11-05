const router = require('express').Router();
const { body } = require('express-validator');
const { getBooks, getBook, createBook, updateBook, deleteBook } = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');

const bookValidation = [
  body('isbn').trim().notEmpty().withMessage('ISBN is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('author').trim().notEmpty().withMessage('Author is required'),
  body('genre').notEmpty().withMessage('Genre is required'),
  body('totalCopies').isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
];

router.get('/', protect, getBooks);
router.get('/:id', protect, getBook);
router.post('/', protect, authorize('librarian'), bookValidation, createBook);
router.patch('/:id', protect, authorize('librarian'), updateBook);
router.delete('/:id', protect, authorize('librarian'), deleteBook);

module.exports = router;
