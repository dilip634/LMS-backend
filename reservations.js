const router = require('express').Router();
const { createReservation, getMyReservations, cancelReservation } = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('patron'), createReservation);
router.get('/my', protect, authorize('patron'), getMyReservations);
router.delete('/:id', protect, cancelReservation);

module.exports = router;
