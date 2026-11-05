const mongoose = require('mongoose');

const LOAN_DURATION_DAYS = 14;
const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 20; // ₹ per day

const circulationSchema = new mongoose.Schema(
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
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checkedOutAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnedAt: { type: Date, default: null },
    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue'],
      default: 'active',
    },
    fine: {
      amount: { type: Number, default: 0 },
      paid: { type: Boolean, default: false },
      paidAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Auto-set dueDate on create
circulationSchema.pre('save', function (next) {
  if (this.isNew && !this.dueDate) {
    const due = new Date(this.checkedOutAt);
    due.setDate(due.getDate() + LOAN_DURATION_DAYS);
    this.dueDate = due;
  }
  next();
});

// Virtual: compute fine on the fly
circulationSchema.virtual('computedFine').get(function () {
  const compareDate = this.returnedAt || new Date();
  if (compareDate <= this.dueDate) return 0;
  const daysLate = Math.ceil((compareDate - this.dueDate) / (1000 * 60 * 60 * 24));
  return daysLate * FINE_PER_DAY;
});

circulationSchema.set('toJSON', { virtuals: true });

circulationSchema.index({ patron: 1, status: 1 });
circulationSchema.index({ book: 1, status: 1 });
circulationSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Circulation', circulationSchema);
