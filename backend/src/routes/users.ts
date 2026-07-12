import { Router } from "express";
import { asyncHandler } from "../middleware/auth.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.post("/", asyncHandler(userController.createUser));
router.get("/wallet/:walletAddress", asyncHandler(userController.getUserByWallet));
router.get("/me", asyncHandler(userController.getUser));

export default router;
