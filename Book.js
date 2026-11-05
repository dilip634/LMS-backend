const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      enum: [
        'Fiction',
        'Non-fiction',
        'Science',
        'History',
        'Biography',
        'Self-help',
        'Technology',
        'Philosophy',
        'Children',
        'Other',
      ],
    },
    publisher: { type: String, trim: true },
    publishedYear: { type: Number },
    totalCopies: {
      type: Number,
      required: true,
      min: [1, 'Must have at least one copy'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      min: 0,
    },
    description: { type: String },
    coverImage: { type: String },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// availableCopies defaults to totalCopies on create
bookSchema.pre('save', function (next) {
  if (this.isNew && this.availableCopies === undefined) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

// Text index for full-text search
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });
bookSchema.index({ genre: 1 });
bookSchema.index({ author: 1 });

module.exports = mongoose.model('Book', bookSchema);
