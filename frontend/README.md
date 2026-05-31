# Torque Rentals — Frontend

A bike and scooter rental web app built from scratch.

## Pages

| File | Description |
|---|---|
| `index.html` | Home page — bike listing, search & filter, quick-view modal |
| `booking.html` | Booking page — date/time picker, price calculator |
| `payment.html` | Razorpay payment checkout |
| `booking-success.html` | Booking confirmation with printable receipt |
| `my-bookings.html` | Booking history with cancel and rebook |
| `login.html` | Login |
| `signup.html` | Sign up |
| `verify-otp.html` | Firebase phone OTP verification |
| `forgot-password.html` | Request password reset |
| `reset-password.html` | Set new password |
| `profile.html` | User profile and account management |
| `dealers.html` | Mumbai dealer locations |
| `helmet-booking.html` | Helmet rental |
| `404.html` | Not found page |

## Shared Scripts

| File | Description |
|---|---|
| `main.js` | Bike data, search/filter, bike modal, scroll-to-top |
| `auth-ui.js` | Nav auth state (show/hide login button vs profile dropdown) |
| `toast.js` | Global toast notification system |

## Running Locally

Serve the folder with any static server, e.g.:

```bash
cd frontend
npx serve .
```

Then open `http://localhost:3000`.

Make sure the backend is running on port 5003 before testing booking and payment.
