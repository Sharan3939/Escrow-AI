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

export async function updateUserRole(req: Request, res: Response) {
  const { role } = req.body;
  if (role !== "CLIENT" && role !== "FREELANCER") {
    res.status(400).json({ success: false, message: "Invalid role. Must be CLIENT or FREELANCER" });
    return;
  }

  const updatedUser = await userService.updateUserRole(req.userId!, role);
  const token = generateToken({
    userId: updatedUser.id,
    walletAddress: updatedUser.walletAddress,
    role: updatedUser.role,
  });

  res.json({
    success: true,
    data: { user: updatedUser, token },
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

export async function getFreelancers(_req: Request, res: Response) {
  const freelancers = await userService.getFreelancers();

  res.json({
    success: true,
    data: freelancers,
    timestamp: new Date().toISOString(),
  } satisfies APIResponse);
}

