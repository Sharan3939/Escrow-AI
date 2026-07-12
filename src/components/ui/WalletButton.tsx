"use client";

import { Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { useEscrowStore } from "@/src/store/useEscrowStore";

export function WalletButton() {
  const connected = useEscrowStore((state) => state.connected);
  const toggleConnection = useEscrowStore((state) => state.toggleConnection);

  return (
    <Button onClick={toggleConnection} className="gap-2 px-5 py-3">
      <Wallet size={16} />
      {connected ? "Wallet connected" : "Connect wallet"}
    </Button>
  );
}
