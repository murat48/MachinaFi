"use client";

import { useWallet } from "@/context/WalletContext";
import { useState } from "react";

export default function WalletButton() {
  const { connected, address, connect, disconnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } finally {
      setIsConnecting(false);
    }
  };

  if (connected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          {address.slice(0, 7)}…{address.slice(-4)}
        </div>
        <button
          onClick={disconnect}
          className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="rounded-full bg-brand-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
