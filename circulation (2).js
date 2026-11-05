const router = require('express').Router();
const {
  checkOut,
  checkIn,
  payFine,
  getOverdue,
  getPatronHistory,
  getActiveLoans,
} = require('../controllers/circulationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/checkout', protect, authorize('librarian'), checkOut);
router.post('/checkin', protect, authorize('librarian'), checkIn);
router.post('/fine/:loanId/pay', protect, authorize('librarian'), payFine);
router.get('/overdue', protect, authorize('librarian'), getOverdue);
router.get('/active', protect, authorize('librarian'), getActiveLoans);
router.get('/history/:patronId', protect, getPatronHistory);

module.exports = router;
