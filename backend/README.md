# Torque Rentals — Backend

Express + PostgreSQL API for the Torque Rentals bike rental app.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create your `.env` file:
```bash
cp .env.example .env
```
Then fill in your values.

3. Create the database schema:
```bash
psql -d your_database -f src/db/schema.sql
```

4. Start the server:
```bash
npm run dev
```

Server runs on `http://localhost:5003` by default.

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5003) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `CORS_ORIGIN` | Frontend origin e.g. `http://127.0.0.1:5500` |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |

## API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/verify-otp` | Verify phone OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Set new password |
| DELETE | `/api/auth/delete-account` | Delete account (auth required) |

### Bikes
| Method | Route | Description |
|---|---|---|
| GET | `/api/bikes` | List all bikes |
| POST | `/api/bikes` | Add a bike |

### Bookings
| Method | Route | Description |
|---|---|---|
| GET | `/api/bookings` | All bookings |
| GET | `/api/bookings/my` | Current user's bookings (auth required) |
| POST | `/api/bookings` | Create booking |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking (auth required) |

### Payments
| Method | Route | Description |
|---|---|---|
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment signature |

## Notes

- Use Razorpay test keys while developing.
- Payment signature is always verified on the backend before marking a booking as paid.
- Frontend should be served from the origin set in `CORS_ORIGIN`.
