import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getUsers } from "../controllers/users.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const usersRouter = Router();

usersRouter.get("/", authenticateToken, requireAdmin, asyncHandler(getUsers));

export default usersRouter;
