import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createBike, getBikes } from "../controllers/bikes.controller.js";

const bikesRouter = Router();

bikesRouter.get("/", asyncHandler(getBikes));
bikesRouter.post("/", asyncHandler(createBike));

export default bikesRouter;
