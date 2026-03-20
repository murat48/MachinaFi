"use client";

import { PaymentRecord } from "@/types";

interface Props {
  payments: PaymentRecord[];
}

export default function PaymentHistory({ payments }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">
        Payment History
      </h2>

      {payments.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">
          No payments recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {payments.slice(0, 20).map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      payment.status === "verified"
                        ? "bg-green-400"
                        : payment.status === "pending"
                          ? "bg-yellow-400"
                          : "bg-red-400"
                    }`}
                  />
                  <span className="text-sm text-white">
                    {payment.amount} {payment.currency}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  TX: {payment.txId.slice(0, 20)}...
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs capitalize ${
                    payment.status === "verified"
                      ? "text-green-400"
                      : payment.status === "pending"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {payment.status}
                </span>
                <p className="text-[10px] text-gray-500">
                  {new Date(payment.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {payments.length > 0 && (
        <div className="mt-4 rounded-lg bg-brand-600/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Total Volume</span>
            <span className="text-lg font-bold text-brand-400">
              {payments
                .filter((p) => p.status === "verified")
                .reduce((sum, p) => sum + p.amount, 0)
                .toFixed(2)}{" "}
              USDCx
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
