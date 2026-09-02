export interface JWTPayload {
  userId: string;
  walletAddress: string;
  role: "CLIENT" | "FREELANCER" | "ADMIN";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export type UserWithoutEmail = Record<string, unknown> & {
  verificationToken?: never;
};
