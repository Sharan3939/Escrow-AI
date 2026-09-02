import { Request, Response } from "express";
import { checkSignature } from "@meshsdk/core";
import * as userService from "../services/user.service.js";
import { generateToken } from "../config/jwt.js";
import type { APIResponse } from "../types/index.js";
import { UserRole } from "@prisma/client";

// In-memory nonce store for simplicity and avoiding DB migrations
// In production, this could be Redis.
const nonceStore = new Map<string, { nonce: string, expires: number }>();

export const getNonce = (req: Request, res: Response) => {
  const { walletAddress } = req.params;
  if (!walletAddress) {
    res.status(400).json({ success: false, message: "Wallet address required" });
    return;
  }

  const nonce = `Sign this message to authenticate with EscrowAI: ${Math.random().toString(36).substring(2, 15)}`;
  // Expires in 5 minutes
  nonceStore.set(walletAddress, { nonce, expires: Date.now() + 5 * 60 * 1000 });

  res.json({ success: true, data: { nonce } });
  return;
};

export const verifySignature = async (req: Request, res: Response) => {
  const { walletAddress, signature, key } = req.body;

  if (!walletAddress || !signature || !key) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  const storedData = nonceStore.get(walletAddress);
  if (!storedData || storedData.expires < Date.now()) {
    res.status(400).json({ success: false, message: "Nonce expired or not found. Request a new one." });
    return;
  }

  try {
    const isValid = checkSignature(storedData.nonce, signature, key);
    
    if (!isValid) {
      res.status(401).json({ success: false, message: "Invalid signature" });
      return;
    }

    // Signature valid. Remove nonce.
    nonceStore.delete(walletAddress);

    // Get or create user
    let user: any = await userService.getUserByWallet(walletAddress).catch(() => null);
    
    if (!user) {
      // Create user if they don't exist
      user = await userService.createUser({
        walletAddress,
        username: `user_${walletAddress.substring(0, 8)}`,
        role: UserRole.CLIENT // Default, they can change later or we can pass in body
      });
    }

    const token = generateToken({
      userId: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    });

    res.json({
      success: true,
      data: { user, token },
      timestamp: new Date().toISOString(),
    } as APIResponse);
    return;
  } catch (error) {
    console.error("Signature verification error:", error);
    res.status(500).json({ success: false, message: "Error verifying signature" });
    return;
  }
};
