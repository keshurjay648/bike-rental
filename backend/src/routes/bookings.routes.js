import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createBooking, getBookings, getMyBookings, cancelBooking } from "../controllers/bookings.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const bookingsRouter = Router();

// Public — admin/all bookings
bookingsRouter.get("/", asyncHandler(getBookings));

// Protected — current user's bookings
bookingsRouter.get("/my", authenticateToken, asyncHandler(getMyBookings));

// Create booking
bookingsRouter.post("/", asyncHandler(createBooking));

// Cancel a booking (owner only)
bookingsRouter.patch("/:id/cancel", authenticateToken, asyncHandler(cancelBooking));

export default bookingsRouter;
