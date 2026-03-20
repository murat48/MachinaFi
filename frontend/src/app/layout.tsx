import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";

export const metadata: Metadata = {
  title: "MachineNet - IoT Machine Economy on Stacks",
  description:
    "Decentralized IoT payment network using x402 protocol on Stacks blockchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] antialiased">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
