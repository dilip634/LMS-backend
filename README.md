# LMS Backend — Node/Express/MongoDB

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET

# 3. (Optional) Seed the database with sample data
npm run seed

# 4. Start the server
npm run dev        # with hot-reload via nodemon
npm start          # production
```

---

## Project Structure

```
src/
├── config/
│   └── db.js                  # MongoDB connection
├── models/
│   ├── User.js                # Patron & Librarian (RBAC)
│   ├── Book.js                # Inventory with text search
│   ├── Circulation.js         # Loans, due dates, fines
│   └── Reservation.js         # Book holds
├── middleware/
│   ├── auth.js                # JWT protect + RBAC authorize
│   └── errorHandler.js        # Global error handler
├── controllers/
│   ├── authController.js
│   ├── bookController.js
│   ├── circulationController.js
│   ├── memberController.js
│   └── reservationController.js
├── routes/
│   ├── auth.js
│   ├── books.js
│   ├── circulation.js
│   ├── members.js
│   └── reservations.js
├── utils/
│   └── seed.js                # Dev data seed
└── server.js
```

---

## API Reference

All routes require `Authorization: Bearer <token>` unless noted.

### Auth
| Method | Endpoint         | Access  | Description          |
|--------|-----------------|---------|----------------------|
| POST   | /api/auth/register | Public | Register new user   |
| POST   | /api/auth/login    | Public | Login, get token    |
| GET    | /api/auth/me       | Any     | Get own profile     |
| PATCH  | /api/auth/me       | Any     | Update own profile  |

### Books
| Method | Endpoint         | Access     | Description              |
|--------|-----------------|------------|--------------------------|
| GET    | /api/books       | Any        | List / search books      |
| GET    | /api/books/:id   | Any        | Get single book          |
| POST   | /api/books       | Librarian  | Add new book             |
| PATCH  | /api/books/:id   | Librarian  | Update book details      |
| DELETE | /api/books/:id   | Librarian  | Remove book              |

**Search query params:** `q` (full-text), `genre`, `author`, `available=true`, `page`, `limit`

### Circulation
| Method | Endpoint                        | Access    | Description              |
|--------|---------------------------------|-----------|--------------------------|
| POST   | /api/circulation/checkout       | Librarian | Check out book to patron |
| POST   | /api/circulation/checkin        | Librarian | Return book              |
| POST   | /api/circulation/fine/:id/pay   | Librarian | Mark fine as paid        |
| GET    | /api/circulation/overdue        | Librarian | All overdue loans        |
| GET    | /api/circulation/active         | Librarian | All active loans         |
| GET    | /api/circulation/history/:id    | Any*      | Patron borrow history    |

*Patrons can only view their own history.

### Members
| Method | Endpoint         | Access    | Description             |
|--------|-----------------|-----------|-------------------------|
| GET    | /api/members     | Librarian | List all patrons        |
| GET    | /api/members/:id | Librarian | Member + loan summary   |
| PATCH  | /api/members/:id | Librarian | Update / deactivate     |

### Reservations
| Method | Endpoint              | Access  | Description          |
|--------|-----------------------|---------|----------------------|
| POST   | /api/reservations     | Patron  | Reserve a book       |
| GET    | /api/reservations/my  | Patron  | My reservations      |
| DELETE | /api/reservations/:id | Any     | Cancel reservation   |

---

## Business Rules

- **Loan duration:** 14 days
- **Max books per patron:** 5
- **Fine:** ₹20/day overdue (configurable via `FINE_PER_DAY` in `.env`)
- Patron with unpaid fines cannot check out new books
- Reservations auto-fulfilled on check-out if the patron had a pending hold
- Deleting a book with active loans is blocked

---

## Seed Accounts

After running `npm run seed`:

| Role      | Email                  | Password    |
|-----------|------------------------|-------------|
| Librarian | librarian@lms.com      | password123 |
| Patron    | rahul@example.com      | password123 |
| Patron    | priya@example.com      | password123 |
