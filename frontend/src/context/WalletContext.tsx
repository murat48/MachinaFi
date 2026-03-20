"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { connect } from "@stacks/connect";

export const STACKS_NETWORK =
  (process.env.NEXT_PUBLIC_STACKS_NETWORK as "testnet" | "mainnet") || "testnet";

interface WalletContextType {
  connected: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  address: null,
  connect: () => {},
  disconnect: () => {},
});

const STORAGE_KEY = "machinenet_wallet";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  // Restore previous session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAddress(saved);
        setConnected(true);
      }
    } catch {}
  }, []);

  const handleConnect = useCallback(async () => {
    console.log("[Wallet] Connect clicked - using @stacks/connect");
    
    try {
      const result = await connect();
      console.log("[Wallet] Connect result:", result);

      const addrs = result?.addresses ?? [];
      const stxAddr =
        addrs.find((a) =>
          STACKS_NETWORK === "testnet"
            ? a.address.startsWith("ST")
            : a.address.startsWith("SP")
        )?.address ??
        addrs[0]?.address ??
        null;

      if (stxAddr) {
        console.log("[Wallet] Connected successfully:", stxAddr);
        setConnected(true);
        setAddress(stxAddr);
        localStorage.setItem(STORAGE_KEY, stxAddr);
      } else {
        console.error("[Wallet] No compatible address found. Addresses:", addrs.map((a) => a.address));
        const addrTypes = addrs.length > 0 ? addrs.map((a) => a.address.slice(0, 2)).join(", ") : "hiçbiri";
        alert(
          `❌ Uyumlu bir adres bulunamadı.\n\n` +
          `Beklenen: ${STACKS_NETWORK === "testnet" ? "ST..." : "SP..."}\n` +
          `Bulunan: ${addrTypes}\n\n` +
          `📱 Çözüm:\n` +
          `1. Wallet ayarlarından Network → Testnet seçin\n` +
          `2. Browser'i yenile (F5)\n` +
          `3. Tekrar deneyin`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Wallet] Connect error:", msg);
      if (!msg.toLowerCase().includes("cancel") && !msg.toLowerCase().includes("reject") && !msg.toLowerCase().includes("closed")) {
        alert(
          `❌ Wallet bağlantı hatası:\n\n${msg}\n\n` +
          `📱 Çözüm:\n` +
          `1. Leather veya Xverse wallet extension yüklü mü?\n` +
          `2. Browser'i yenile (F5)\n` +
          `3. Tekrar deneyin`
        );
      }
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        connected,
        address,
        connect: handleConnect,
        disconnect: handleDisconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

