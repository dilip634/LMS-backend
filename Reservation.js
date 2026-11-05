const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    patron: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      // Reservation hold expires after 3 days once book is available
    },
  },
  { timestamps: true }
);

reservationSchema.index({ book: 1, status: 1 });
reservationSchema.index({ patron: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
