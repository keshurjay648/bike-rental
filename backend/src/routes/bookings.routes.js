import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createBooking, getBookings } from "../controllers/bookings.controller.js";

const bookingsRouter = Router();

bookingsRouter.get("/", asyncHandler(getBookings));
bookingsRouter.post("/", asyncHandler(createBooking));

export default bookingsRouter;
