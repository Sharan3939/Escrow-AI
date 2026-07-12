import prisma from "../config/database.js";
import { APIError } from "../middleware/errors.js";
import type { CreateUserInput } from "../validators/index.js";

export async function createUser(data: CreateUserInput) {
  const existing = await prisma.user.findUnique({
    where: { walletAddress: data.walletAddress },
  });

  if (existing) {
    throw new APIError(409, "User already exists with this wallet address");
  }

  return prisma.user.create({
    data: {
      walletAddress: data.walletAddress,
      username: data.username,
      email: data.email,
      role: data.role,
    },
    select: {
      id: true,
      walletAddress: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getUserByWallet(walletAddress: string) {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: {
      id: true,
      walletAddress: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  return user;
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      walletAddress: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new APIError(404, "User not found");
  }

  return user;
}
