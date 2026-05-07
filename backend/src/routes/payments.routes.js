import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createPaymentOrder, verifyPayment } from "../controllers/payments.controller.js";

const paymentsRouter = Router();

paymentsRouter.post("/create-order", asyncHandler(createPaymentOrder));
paymentsRouter.post("/verify", asyncHandler(verifyPayment));

export default paymentsRouter;
