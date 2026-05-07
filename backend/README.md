# Bike Rental Backend

## Setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - copy `.env.example` to `.env`
3. Create database schema:
   - run SQL in `src/db/schema.sql` on your PostgreSQL database
4. Seed bikes (optional):
   - run SQL in `src/db/seed_bikes.sql`
5. Start server:
   - `npm run dev`

## Frontend Notes

- `booking.js` and `payment.js` call `http://localhost:5000/api` by default.
- Make sure backend is running before booking and payment testing.
- Run your frontend with Live Server (for example `http://127.0.0.1:5500`), and keep `CORS_ORIGIN` in `.env` matching that origin.

## API Routes

- `GET /health`
- `GET /api/bikes`
- `POST /api/bikes`
- `GET /api/bookings`
- `POST /api/bookings`
- `POST /api/payments/create-order`
- `POST /api/payments/verify`

## Razorpay Notes

- Use test keys from Razorpay dashboard while developing.
- Signature is always verified on backend before marking booking as paid.
