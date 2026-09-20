import { Router } from "express";
import { asyncHandler, authMiddleware } from "../middleware/auth.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.post("/", asyncHandler(userController.createUser));
router.get("/freelancers", asyncHandler(userController.getFreelancers));
router.get("/wallet/:walletAddress", asyncHandler(userController.getUserByWallet));
router.get("/me", authMiddleware, asyncHandler(userController.getUser));
router.put("/role", authMiddleware, asyncHandler(userController.updateUserRole));

export default router;

