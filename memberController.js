const User = require('../models/User');
const Circulation = require('../models/Circulation');

// GET /api/members  — librarian only
exports.getMembers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = { role: 'patron' };

    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { membershipId: new RegExp(q, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [members, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), data: members });
  } catch (err) {
    next(err);
  }
};

// GET /api/members/:id
exports.getMember = async (req, res, next) => {
  try {
    const member = await User.findOne({ _id: req.params.id, role: 'patron' });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    const [activeLoans, totalLoans, unpaidFines] = await Promise.all([
      Circulation.countDocuments({ patron: member._id, status: { $in: ['active', 'overdue'] } }),
      Circulation.countDocuments({ patron: member._id }),
      Circulation.aggregate([
        { $match: { patron: member._id, 'fine.paid': false, 'fine.amount': { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$fine.amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        ...member.toJSON(),
        activeLoans,
        totalLoans,
        unpaidFines: unpaidFines[0]?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/members/:id  — librarian only
exports.updateMember = async (req, res, next) => {
  try {
    const { name, phone, address, isActive } = req.body;
    const member = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'patron' },
      { name, phone, address, isActive },
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
};
