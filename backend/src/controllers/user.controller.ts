import { Request, Response } from "express";
import { CreateUserSchema } from "../validators/index.js";
import * as userService from "../services/user.service.js";
import { generateToken } from "../config/jwt.js";
import type { APIResponse } from "../types/index.js";

export async function createUser(req: Request, res: Response) {
  const data = CreateUserSchema.parse(req.body);
  const user = await userService.createUser(data);
  const token = generateToken({
    userId: user.id,
    walletAddress: user.walletAddress,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    data: { user, token },
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getUserByWallet(req: Request, res: Response) {
  const { walletAddress } = req.params;
  const user = await userService.getUserByWallet(walletAddress);

  res.json({
    success: true,
    data: user,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getUser(req: Request, res: Response) {
  const user = await userService.getUserById(req.userId!);

  res.json({
    success: true,
    data: user,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}
