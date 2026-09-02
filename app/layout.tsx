import type { Metadata } from "next";
import "./globals.css";

import { WalletConnect } from "@/src/components/wallet/WalletConnect";

export const metadata: Metadata = {
  title: "EscrowAI | Cardano AI-powered freelance escrow",
  description:
    "Trustless freelance payments powered by Cardano and AI verifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100">
        <WalletConnect>
          {children}
        </WalletConnect>
      </body>
    </html>
  );
}