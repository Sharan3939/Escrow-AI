export function isValidTransactionHash(hash: string): boolean {
  // Cardano transaction hashes are typically 64 hex characters long.
  return /^[0-9a-fA-F]{64}$/.test(hash);
}
