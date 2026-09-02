export function isPreviewNetwork(network: string): boolean {
  return network.toLowerCase() === 'preview';
}

export function validateNetwork(network: string): void {
  if (!isPreviewNetwork(network)) {
    throw new Error(`Invalid network: ${network}. Only 'preview' network is supported.`);
  }
}
