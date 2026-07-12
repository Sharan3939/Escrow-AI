export interface JWTPayload {
  userId: string;
  walletAddress: string;
  role: "CLIENT" | "FREELANCER" | "ADMIN";
}

export interface APIResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export type UserWithoutEmail = Record<string, unknown> & {
  verificationToken?: never;
};
