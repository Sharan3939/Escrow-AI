import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

// Wrap async routes in a handler if needed, here just basic async
router.get("/nonce/:walletAddress", authController.getNonce);
router.post("/verify", authController.verifySignature);

export default router;
