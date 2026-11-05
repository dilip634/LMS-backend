const router = require('express').Router();
const { getMembers, getMember, updateMember } = require('../controllers/memberController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('librarian'), getMembers);
router.get('/:id', protect, authorize('librarian'), getMember);
router.patch('/:id', protect, authorize('librarian'), updateMember);

module.exports = router;
