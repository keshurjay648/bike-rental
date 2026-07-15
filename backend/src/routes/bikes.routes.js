import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createBike,
  deleteBike,
  getBikes,
  getBikesWithAvailability,
  updateBike
} from "../controllers/bikes.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { uploadBikeImage } from "../middleware/upload.js";

const bikesRouter = Router();

bikesRouter.get("/", asyncHandler(getBikes));
bikesRouter.get(
  "/admin/availability",
  authenticateToken,
  requireAdmin,
  asyncHandler(getBikesWithAvailability)
);
bikesRouter.post(
  "/",
  authenticateToken,
  requireAdmin,
  uploadBikeImage.single("image"),
  asyncHandler(createBike)
);
bikesRouter.patch(
  "/:id",
  authenticateToken,
  requireAdmin,
  uploadBikeImage.single("image"),
  asyncHandler(updateBike)
);
bikesRouter.delete("/:id", authenticateToken, requireAdmin, asyncHandler(deleteBike));

export default bikesRouter;
