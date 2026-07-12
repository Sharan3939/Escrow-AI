import { Router } from "express";
import { asyncHandler } from "../middleware/auth.js";
import * as transactionController from "../controllers/transaction.controller.js";

const router = Router();

router.post("/", asyncHandler(transactionController.createTransaction));
router.get("/:projectId", asyncHandler(transactionController.getTransactions));

export default router;
