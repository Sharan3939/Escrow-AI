import { Router } from "express";
import { asyncHandler, authMiddleware } from "../middleware/auth.js";
import * as cardanoController from "../controllers/cardano.controller.js";

const router = Router();

router.get("/balance/:address", authMiddleware, asyncHandler(cardanoController.getBalance));
router.get("/utxos/:address", asyncHandler(cardanoController.getAddressUtxos));
router.get("/transaction/:hash", authMiddleware, asyncHandler(cardanoController.verifyTransaction));

router.post(
  "/escrow-status",
  authMiddleware,
  asyncHandler(cardanoController.updateEscrowStatus)
);

export default router;
