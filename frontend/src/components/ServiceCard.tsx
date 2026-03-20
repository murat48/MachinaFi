"use client";

import { MachineService } from "@/types";
import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { makeServicePayment } from "@/lib/wallet";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Props {
  service: MachineService;
  onActivity?: () => void;
}

export default function ServiceCard({ service, onActivity }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { connected, address, connect } = useWallet();

  const handleRequest = async () => {
    // Require wallet connection before payment
    if (!connected) {
      connect();
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Step 1: Request service without payment to receive 402 + payment instructions
      const initialRes = await fetch(`${API_BASE}${service.endpoint}`, {
        method: service.method,
        headers: { "Content-Type": "application/json" },
        body: service.method === "POST" ? JSON.stringify({}) : undefined,
      });

      const initialData = await initialRes.json();

      if (initialRes.status !== 402) {
        setResult({ step: "direct", data: initialData });
        onActivity?.();
        return;
      }

      const receiverAddress =
        initialData.paymentInstructions?.receiver ||
        process.env.NEXT_PUBLIC_PAYMENT_RECEIVER ||
        "";

      // Step 2: Open Hiro Wallet — user signs the on-chain payment
      const txId = await makeServicePayment(
        service.id,
        service.price,
        receiverAddress,
        address!
      );

      // Step 3: Submit real txId to backend for verification
      const paidRes = await fetch(`${API_BASE}${service.endpoint}`, {
        method: service.method,
        headers: {
          "Content-Type": "application/json",
          "X-Payment-TxId": txId,
        },
        body:
          service.method === "POST"
            ? JSON.stringify({ sender: address })
            : undefined,
      });

      const paidData = await paidRes.json();
      setResult({ step: "paid", txId, data: paidData });
      onActivity?.();
    } catch (err: any) {
      setResult({ error: err.message || "Payment failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-white/20 hover:bg-white/[0.05]">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{service.icon}</span>
          <div>
            <h3 className="font-semibold text-white">{service.name}</h3>
            <span className="inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gray-400">
              {service.category}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-brand-400">
            {service.price} {service.currency}
          </div>
          <div className="text-[11px] text-gray-500">{service.priceUnit}</div>
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-400">{service.description}</p>

      <div className="mb-4 rounded-lg bg-black/30 p-2.5">
        <code className="text-xs text-gray-300">
          <span className="text-brand-400">{service.method}</span>{" "}
          {service.endpoint}
        </code>
      </div>

      <button
        onClick={handleRequest}
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Waiting for wallet…
          </span>
        ) : !connected ? (
          "Connect Wallet to Pay"
        ) : (
          `Pay ${service.price} ${service.currency} & Request`
        )}
      </button>

      {result && (
        <div
          className={`mt-3 rounded-lg p-3 text-xs ${
            result.error
              ? "bg-red-500/10 text-red-300"
              : "bg-green-500/10 text-green-300"
          }`}
        >
          {result.error ? (
            <p>Error: {result.error}</p>
          ) : (
            <div>
              <p className="mb-1 font-medium">
                {result.step === "paid"
                  ? "✅ Payment broadcast & service activated"
                  : "✅ Service responded"}
              </p>
              {result.txId && (
                <a
                  href={`https://explorer.hiro.so/txid/${result.txId}?chain=testnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-[11px] text-brand-400 underline underline-offset-2"
                >
                  View on Explorer ↗
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
