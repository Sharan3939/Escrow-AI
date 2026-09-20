import { Request, Response } from "express";
import { checkSignature } from "@meshsdk/core";
import * as userService from "../services/user.service.js";
import { generateToken } from "../config/jwt.js";
import type { APIResponse } from "../types/index.js";
import { UserRole } from "@prisma/client";

// In-memory nonce store for simplicity and avoiding DB migrations
// In production, this could be Redis.
const nonceStore = new Map<string, { nonce: string; expires: number }>();
const activeNonces = new Map<string, { walletAddress?: string; expires: number }>();

export const getNonce = (req: Request, res: Response) => {
  const walletAddress =
    req.params.walletAddress ||
    (req.query.walletAddress as string) ||
    (req.query.address as string);

  const nonce = `Sign this message to authenticate with EscrowAI: ${Math.random().toString(36).substring(2, 15)}`;
  const expires = Date.now() + 5 * 60 * 1000;

  if (walletAddress) {
    nonceStore.set(walletAddress, { nonce, expires });
  }
  activeNonces.set(nonce, { walletAddress, expires });

  console.log(`[AUTH DEBUG] nonce generated for walletAddress: ${walletAddress || "any"}, nonce: ${nonce}`);
  res.json({ success: true, data: { nonce } });
  return;
};

export const verifySignature = async (req: Request, res: Response) => {
  const { walletAddress, signature, key, nonce: providedNonce } = req.body;
  console.log(`[AUTH DEBUG] verify request received on backend for walletAddress: ${walletAddress}`);

  if (!walletAddress || !signature || !key) {
    console.warn("[AUTH DEBUG] verify failed: missing required fields", { walletAddress: !!walletAddress, signature: !!signature, key: !!key });
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  let expectedNonce = "";
  const storedData = nonceStore.get(walletAddress);
  if (storedData && storedData.expires >= Date.now()) {
    expectedNonce = storedData.nonce;
  } else if (providedNonce && activeNonces.has(providedNonce)) {
    const nonceData = activeNonces.get(providedNonce);
    if (nonceData && nonceData.expires >= Date.now()) {
      expectedNonce = providedNonce;
    }
  }

  if (!expectedNonce) {
    console.warn(`[AUTH DEBUG] verify failed: nonce expired or not found for address ${walletAddress}`);
    res.status(400).json({ success: false, message: "Nonce expired or not found. Request a new one." });
    return;
  }

  try {
    console.log(`[AUTH DEBUG] verifying signature with checkSignature() for expectedNonce: ${expectedNonce}`);
    const isValid = await checkSignature(
      expectedNonce,
      { key, signature },
      walletAddress
    );

    console.log(`[AUTH DEBUG] checkSignature result: ${isValid}`);
    if (!isValid) {
      res.status(401).json({ success: false, message: "Invalid signature" });
      return;
    }

    // Signature valid. Remove nonce.
    nonceStore.delete(walletAddress);
    if (expectedNonce) activeNonces.delete(expectedNonce);

    // Get or create user
    let user: any = await userService.getUserByWallet(walletAddress).catch(() => null);

    if (!user) {
      // Create user if they don't exist
      const cleanAddr = walletAddress.replace(/[^a-zA-Z0-9]/g, "");
      const uniqueSuffix = Date.now().toString(36).slice(-4);
      const username = `user_${cleanAddr.substring(0, 8)}_${uniqueSuffix}`;
      user = await userService.createUser({
        walletAddress,
        username,
        role: UserRole.CLIENT,
      });
      console.log(`[AUTH DEBUG] new user created in database: ${user.id} (${username})`);
    } else {
      console.log(`[AUTH DEBUG] existing user retrieved: ${user.id} (${user.username})`);
    }

    const token = generateToken({
      userId: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
    });

    console.log(`[AUTH DEBUG] JWT generated successfully for user ${user.id}`);
    res.json({
      success: true,
      data: { user, token },
      timestamp: new Date().toISOString(),
    } as APIResponse);
    return;
  } catch (error) {
    console.error("[AUTH DEBUG] Signature verification exception:", error);
    res.status(500).json({ success: false, message: "Error verifying signature" });
    return;
  }
};
