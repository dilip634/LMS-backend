require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Book = require('../models/Book');

const books = [
  { isbn: '9780735211292', title: 'Atomic Habits', author: 'James Clear', genre: 'Self-help', totalCopies: 3, publishedYear: 2018 },
  { isbn: '9780525559474', title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', totalCopies: 2, publishedYear: 2020 },
  { isbn: '9780062316097', title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', totalCopies: 4, publishedYear: 2011 },
  { isbn: '9780374533557', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Non-fiction', totalCopies: 2, publishedYear: 2011 },
  { isbn: '9780062315007', title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', totalCopies: 5, publishedYear: 1988 },
  { isbn: '9780385490818', title: '1984', author: 'George Orwell', genre: 'Fiction', totalCopies: 3, publishedYear: 1949 },
];

const seed = async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();

  const librarian = await User.create({
    name: 'Anita Krishnan',
    email: 'librarian@lms.com',
    password: 'password123',
    role: 'librarian',
  });

  await User.create([
    { name: 'Rahul Kumar', email: 'rahul@example.com', password: 'password123', role: 'patron', phone: '9876543210' },
    { name: 'Priya Sharma', email: 'priya@example.com', password: 'password123', role: 'patron', phone: '9123456789' },
    { name: 'Deepika Rao', email: 'deepika@example.com', password: 'password123', role: 'patron' },
  ]);

  await Book.create(books.map((b) => ({ ...b, addedBy: librarian._id })));

  console.log('✅ Seed complete');
  console.log('   Librarian → librarian@lms.com / password123');
  console.log('   Patron    → rahul@example.com / password123');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
