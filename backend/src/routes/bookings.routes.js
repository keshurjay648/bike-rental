import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createBooking,
  getBookings,
  getMyBookings,
  cancelBooking,
  deleteBooking
} from "../controllers/bookings.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const bookingsRouter = Router();

// Admin — all bookings
bookingsRouter.get("/", authenticateToken, requireAdmin, asyncHandler(getBookings));

// Protected — current user's bookings
bookingsRouter.get("/my", authenticateToken, asyncHandler(getMyBookings));

// Create booking
bookingsRouter.post("/", asyncHandler(createBooking));

// Cancel a booking (owner or admin)
bookingsRouter.patch("/:id/cancel", authenticateToken, asyncHandler(cancelBooking));

// Delete a booking (admin only) — frees the bike slot globally
bookingsRouter.delete("/:id", authenticateToken, requireAdmin, asyncHandler(deleteBooking));

export default bookingsRouter;
