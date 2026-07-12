import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/jwt.js";
import { APIError } from "./errors.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      walletAddress?: string;
    }
  }
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new APIError(401, "Missing authentication token");
  }

  const payload = verifyToken(token);
  req.userId = payload.userId;
  req.userRole = payload.role;
  req.walletAddress = payload.walletAddress;

  next();
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
