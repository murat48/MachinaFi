import { config } from "../config";
import { PaymentRecord } from "../types";
import { addPayment, getPaymentByTxId, updatePaymentStatus, getPayments } from "./store";
import { acquireNonce } from "./nonce-manager";
import {
  makeContractCall,
  broadcastTransaction,
  bufferCV,
  stringAsciiCV,
  principalCV,
  uintCV,
  PostConditionMode,
} from "@stacks/transactions";
import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";

const _networkObj = config.stacks.network === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
const _networkName = config.stacks.network === "mainnet" ? "mainnet" : "testnet";

/** txIds that have already been successfully registered on-chain — prevents duplicate calls */
const _registeredOnChain = new Set<string>();

/**
 * Register a verified payment on the machinenet-payment Clarity contract.
 * Fire-and-forget safe: errors are logged but never bubble up.
 */
export async function registerPaymentOnContract(
  txId: string,
  receiver: string,
  amount: number,
  serviceId: string,
  nonce?: number
): Promise<string | null> {
  const privateKey = config.stacks.simPrivateKey;
  if (!privateKey || !config.machinenetContract.address) return null;

  // Skip if already registered to prevent duplicate on-chain calls
  if (_registeredOnChain.has(txId)) return null;

  try {
    let txIdBuf: Buffer;
    const hexOnly = txId.replace(/^0x/, "");
    if (/^[0-9a-fA-F]+$/.test(hexOnly)) {
      // Real on-chain txId: convert hex string to 32-byte buffer
      txIdBuf = Buffer.from(hexOnly.padStart(64, "0").slice(0, 64), "hex");
    } else {
      // Simulation/M2M txId: UTF-8 encode into a zero-padded 32-byte buffer
      txIdBuf = Buffer.alloc(32, 0);
      Buffer.from(txId, "utf8").copy(txIdBuf, 0, 0, 32);
    }

    let callNonce = nonce;
    if (callNonce === undefined) {
      callNonce = await acquireNonce();
    }

    const amountMicro = BigInt(Math.round(amount * 1_000_000));
    const safeServiceId = (serviceId || "unknown").slice(0, 64);

    const tx = await makeContractCall({
      network: _networkObj,
      contractAddress: config.machinenetContract.address,
      contractName: config.machinenetContract.name,
      functionName: "register-payment",
      functionArgs: [
        bufferCV(txIdBuf),
        principalCV(receiver),
        uintCV(amountMicro),
        stringAsciiCV(safeServiceId),
      ],
      senderKey: privateKey,
      nonce: BigInt(callNonce),
      postConditionMode: PostConditionMode.Allow,
    });

    const result = await broadcastTransaction({ transaction: tx, network: _networkObj });
    if ("error" in result) {
      const reason = (result as any).reason || "";
      throw new Error(`Broadcast failed: ${result.error}${reason ? " — " + reason : ""}`);
    }

    _registeredOnChain.add(txId);
    return result.txid;
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Verify a Stacks transaction by querying the Stacks blockchain API.
 * Accepts transactions that are pending or successfully confirmed.
 */
export async function verifyPayment(
  txId: string,
  expectedAmount: number,
  expectedCurrency: string,
  sender: string,
  serviceId?: string
): Promise<{ verified: boolean; message: string }> {
  // Reject obviously fake transaction IDs
  if (!txId || txId.startsWith("demo_")) {
    return { verified: false, message: "Invalid transaction ID — wallet payment required" };
  }

  // M2M simulation payments — already recorded by the simulation engine
  if (txId.startsWith("m2m_")) {
    registerPaymentOnContract(txId, config.stacks.paymentReceiver, expectedAmount, serviceId || "unknown")
      .catch(() => { /* ignore */ });
    return { verified: true, message: "M2M payment verified" };
  }

  // Allow simulation mode — sim_ prefixed IDs create real records without blockchain lookup
  if (txId.startsWith("sim_")) {
    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      serviceId: "",
      from: sender,
      to: config.stacks.paymentReceiver,
      amount: expectedAmount,
      currency: expectedCurrency,
      txId,
      status: "verified",
      timestamp: Date.now(),
    };
    addPayment(payment);
    registerPaymentOnContract(txId, config.stacks.paymentReceiver, expectedAmount, serviceId || "unknown")
      .catch(() => { /* ignore */ });
    return { verified: true, message: "Simulation payment recorded" };
  }

  // Prevent duplicate records: if already verified, return immediately
  const existing = getPaymentByTxId(txId);
  if (existing?.status === "verified") {
    return { verified: true, message: "Payment already verified" };
  }

  try {
    const apiUrl = config.stacks.apiUrl.replace(/\/$/, "");
    // Hiro API requires 0x prefix and follows a redirect — use full ID
    const normalizedId = txId.startsWith("0x") ? txId : `0x${txId}`;
    const response = await fetch(`${apiUrl}/extended/v1/tx/${normalizedId}`, {
      headers: { Accept: "application/json" },
      redirect: "follow",
    });

    if (response.status === 404) {
      // Not yet indexed — record as pending only if not already tracked
      if (!existing) {
        addPayment({
          id: `pay_${Date.now()}`,
          serviceId: "",
          from: sender,
          to: config.stacks.paymentReceiver,
          amount: expectedAmount,
          currency: expectedCurrency,
          txId,
          status: "pending",
          timestamp: Date.now(),
        });
      }
      return { verified: true, message: "Transaction submitted, awaiting confirmation" };
    }

    if (!response.ok) {
      return { verified: false, message: "Failed to query Stacks API" };
    }

    const tx = await response.json() as { tx_status: string; sender_address?: string };
    const status: string = tx.tx_status;

    const isVerified = status === "success";
    const isPending = status === "pending" || status === "submitted" || status === "microblock_accepted";

    if (isVerified || isPending) {
      if (existing) {
        // Update the existing pending record instead of creating a duplicate
        if (isVerified) updatePaymentStatus(txId, "verified");
      } else {
        addPayment({
          id: `pay_${Date.now()}`,
          serviceId: "",
          from: tx.sender_address || sender,
          to: config.stacks.paymentReceiver,
          amount: expectedAmount,
          currency: expectedCurrency,
          txId,
          status: isVerified ? "verified" : "pending",
          timestamp: Date.now(),
        });
      }
      // Register on machinenet-payment contract for every payment (fire-and-forget)
      registerPaymentOnContract(txId, config.stacks.paymentReceiver, expectedAmount, serviceId || "unknown")
        .catch(() => { /* ignore */ });

      return {
        verified: true,
        message: isVerified
          ? "Payment verified on Stacks blockchain"
          : "Transaction is pending on-chain confirmation",
      };
    }

    return { verified: false, message: `Transaction status: ${status}` };
  } catch (err) {
    return { verified: false, message: "Error querying Stacks API" };
  }
}

/**
 * Background job: re-check all pending payments and promote to verified/failed.
 * Call on a setInterval (e.g. every 30s) from the server entry point.
 */
export async function refreshPendingPayments(): Promise<void> {
  const pending = getPayments().filter(
    (p) =>
      p.status === "pending" &&
      !p.txId.startsWith("m2m_") &&
      !p.txId.startsWith("sim_")
  );
  if (pending.length === 0) return;

  const apiUrl = config.stacks.apiUrl.replace(/\/$/, "");
  for (const payment of pending) {
    try {
      const normalizedId = payment.txId.startsWith("0x") ? payment.txId : `0x${payment.txId}`;
      const res = await fetch(`${apiUrl}/extended/v1/tx/${normalizedId}`, {
        headers: { Accept: "application/json" },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const tx = await res.json() as { tx_status: string };
      if (tx.tx_status === "success") {
        updatePaymentStatus(payment.txId, "verified");
        registerPaymentOnContract(payment.txId, config.stacks.paymentReceiver, payment.amount, payment.serviceId || "unknown")
          .catch(() => { /* ignore */ });
      } else if (
        tx.tx_status === "abort_by_response" ||
        tx.tx_status === "abort_by_post_condition" ||
        tx.tx_status === "dropped_replace_by_fee" ||
        tx.tx_status === "dropped_stale_garbage_collect"
      ) {
        updatePaymentStatus(payment.txId, "failed");
      }
    } catch {
      // Ignore individual errors — retry on next interval
    }
  }
}

/**
 * Generate x402 payment instructions for a service.
 */
export function generatePaymentInstructions(
  serviceId: string,
  amount: number,
  currency: "USDCx" | "sBTC"
) {
  const tokenConfig = config.tokens.usdcx;

  return {
    version: "x402-1.0",
    network: config.stacks.network,
    receiver: config.stacks.paymentReceiver,
    amount,
    currency,
    contract: {
      address: tokenConfig.contractAddress,
      name: tokenConfig.contractName,
    },
    memo: `x402:${serviceId}:${Date.now()}`,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    verifyUrl: `/api/payments/verify`,
  };
}
