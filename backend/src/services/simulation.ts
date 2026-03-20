import { v4 as uuidv4 } from "uuid";
import { DeviceActivity } from "../types";
import { addActivity, addPayment } from "./store";
import { getServiceById } from "./registry";
import { config } from "../config";
import { acquireNonce, resetNonce } from "./nonce-manager";
import {
  makeContractCall,
  broadcastTransaction,
  principalCV,
  uintCV,
  noneCV,
  PostConditionMode,
  getAddressFromPrivateKey,
} from "@stacks/transactions";
import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SimStep {
  from: string;
  to: string;
  serviceId: string;
  endpoint: string;
  method: "GET" | "POST";
  body?: Record<string, unknown>;
}

const SIM_STEPS: SimStep[] = [
  {
    from: "Electric Car",
    to: "EV Charging Station",
    serviceId: "ev-charging",
    endpoint: "/api/services/charge/start",
    method: "POST",
    body: { vehicleId: "EV-CAR-001", batteryLevel: 15 },
  },
  {
    from: "EV Charging Station",
    to: "Energy Price Sensor",
    serviceId: "energy-sensor",
    endpoint: "/api/services/energy/price?sender=charging-station",
    method: "GET",
  },
  {
    from: "Electric Car",
    to: "Smart Parking Meter",
    serviceId: "smart-parking",
    endpoint: "/api/services/parking/pay",
    method: "POST",
    body: { vehicleId: "EV-CAR-001", duration: 1 },
  },
];

const BASE = `http://localhost:${config.port}`;

const networkObj = config.stacks.network === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;
const networkName = config.stacks.network === "mainnet" ? "mainnet" : "testnet";

/** Poll until tx appears in mempool (up to maxWaitMs) */
async function waitForMempool(txId: string, maxWaitMs = 60_000): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs;
  const apiBase = config.stacks.apiUrl.replace(/\/$/, "");
  while (Date.now() < deadline) {
    await delay(3000);
    const res = await fetch(`${apiBase}/extended/v1/tx/${txId}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const tx = await res.json() as { tx_status: string };
      if (tx.tx_status && tx.tx_status !== "dropped_replace_by_fee" && tx.tx_status !== "dropped_stale_garbage_collect") {
        return true;
      }
    }
    // 404 = not yet indexed, keep polling
  }
  return false;
}

/**
 * Broadcasts a real USDCx SIP-010 transfer on-chain using the simulation private key.
 * Accepts an explicit nonce to avoid collisions when broadcasting multiple txs.
 * Returns the real txId.
 */
async function broadcastUsdcxTransfer(
  recipient: string,
  amountUsdcx: number,
  nonce: number
): Promise<string> {
  const privateKey = config.stacks.simPrivateKey;
  if (!privateKey) {
    throw new Error("SIM_PRIVATE_KEY not set — cannot broadcast real transaction");
  }

  const senderAddress = getAddressFromPrivateKey(privateKey, networkName as any);
  const amountMicro = BigInt(Math.round(amountUsdcx * 1_000_000));

  const tx = await makeContractCall({
    network: networkObj,
    contractAddress: config.tokens.usdcx.contractAddress,
    contractName: config.tokens.usdcx.contractName,
    functionName: "transfer",
    functionArgs: [
      uintCV(amountMicro),
      principalCV(senderAddress),
      principalCV(recipient),
      noneCV(),
    ],
    senderKey: privateKey,
    nonce: BigInt(nonce),
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      {
        type: "ft-postcondition",
        address: senderAddress,
        condition: "eq",
        asset: `${config.tokens.usdcx.contractAddress}.${config.tokens.usdcx.contractName}::${config.tokens.usdcx.tokenName}`,
        amount: amountMicro,
      } as any,
    ],
  });

  const result = await broadcastTransaction({ transaction: tx, network: networkObj });

  if ("error" in result) {
    throw new Error(`Broadcast failed: ${result.error} — ${(result as any).reason}`);
  }

  return result.txid;
}

export async function runSimulation(): Promise<DeviceActivity[]> {
  const allActivities: DeviceActivity[] = [];

  const log = (
    deviceName: string,
    action: string,
    details: string,
    type: DeviceActivity["type"],
    serviceId?: string
  ): DeviceActivity => {
    const activity: DeviceActivity = {
      id: uuidv4(),
      deviceName,
      action,
      serviceId,
      timestamp: Date.now(),
      details,
      type,
    };
    addActivity(activity);
    allActivities.push(activity);
    return activity;
  };

  log("System", "simulation_start", "Machine Economy Simulation started", "info");
  await delay(300);

  // Reset shared nonce counter so this run re-syncs from the current chain state.
  // Both broadcastUsdcxTransfer and registerPaymentOnContract will draw from the
  // same counter, preventing ConflictingNonceInMempool errors.
  resetNonce();

  const simAddress = config.stacks.simPrivateKey
    ? getAddressFromPrivateKey(config.stacks.simPrivateKey, networkName as any)
    : null;

  if (simAddress) {
    log("System", "info", `Simulation wallet: ${simAddress}`, "info");
  }

  for (const step of SIM_STEPS) {
    const service = getServiceById(step.serviceId);
    if (!service) continue;

    // 1. Device requests service
    log(step.from, "request", `${step.from} requesting ${service.name}`, "request", step.serviceId);
    await delay(500);

    // 2. Call endpoint without payment → expect 402
    const url = `${BASE}${step.endpoint}`;
    const initialRes = await fetch(url, {
      method: step.method,
      headers: { "Content-Type": "application/json" },
      body: step.method === "POST" ? JSON.stringify(step.body || {}) : undefined,
    });

    if (initialRes.status !== 402) {
      log(step.to, "error", `Unexpected status ${initialRes.status} (expected 402)`, "error", step.serviceId);
      continue;
    }

    const data402 = await initialRes.json();
    log(
      step.to,
      "payment_required",
      `${service.name} requires ${service.price} ${service.currency}`,
      "payment",
      step.serviceId
    );
    await delay(400);

    // 3. Broadcast real on-chain payment (or fallback to simulated)
    let txId: string;
    let isReal = false;
    const recipient = config.stacks.paymentReceiver || step.to;

    if (config.stacks.simPrivateKey) {
      try {
        const txNonce = await acquireNonce();
        log(step.from, "signing", `Signing USDCx transfer (nonce: ${txNonce}) for ${service.price} ${service.currency}...`, "info", step.serviceId);
        txId = await broadcastUsdcxTransfer(recipient, service.price, txNonce);
        isReal = true;
        log(step.from, "broadcast", `Transaction broadcast: ${txId}`, "info", step.serviceId);

        // Wait for tx to appear in mempool before calling the service endpoint
        log(step.from, "info", `Waiting for tx to be indexed...`, "info", step.serviceId);
        const indexed = await waitForMempool(txId, 60_000);
        if (!indexed) {
          log(step.from, "error", `Tx ${txId} not indexed within 60s — proceeding anyway`, "error", step.serviceId);
        } else {
          log(step.from, "info", `Tx indexed in mempool`, "info", step.serviceId);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        log(step.from, "error", `Real tx failed: ${msg}`, "error", step.serviceId);
        txId = `m2m_${uuidv4().slice(0, 12)}`;
      }
    } else {
      txId = `m2m_${uuidv4().slice(0, 12)}`;
      log(step.from, "info", `[SIMULATED] No SIM_PRIVATE_KEY — using mock txId`, "info", step.serviceId);
    }

    // Only pre-record mock payments here; real-tx payments are recorded by verifyPayment()
    if (!isReal) {
      addPayment({
        id: `pay_${Date.now()}`,
        serviceId: step.serviceId,
        from: step.from,
        to: recipient,
        amount: service.price,
        currency: service.currency,
        txId,
        status: "verified",
        timestamp: Date.now(),
      });
    }

    log(
      step.from,
      "payment_sent",
      `${isReal ? "🔗 Real tx" : "🔵 Simulated"}: Paid ${service.price} ${service.currency} (tx: ${txId})`,
      "payment",
      step.serviceId
    );
    await delay(500);

    // 4. Retry with payment header → service delivered
    const paidRes = await fetch(url, {
      method: step.method,
      headers: {
        "Content-Type": "application/json",
        "X-Payment-TxId": txId,
      },
      body: step.method === "POST" ? JSON.stringify({ ...(step.body || {}), sender: step.from }) : undefined,
    });

    const paidData = (await paidRes.json()) as Record<string, string>;

    if (paidRes.ok) {
      log(step.to, "payment_verified", "Payment received and verified", "payment", step.serviceId);
      await delay(300);
      log(
        step.to,
        "service_delivered",
        `${service.name} delivered to ${step.from}`,
        "service",
        step.serviceId
      );
    } else {
      log(step.to, "error", `Service failed: ${paidData.error || paidData.message || "unknown"}`, "error", step.serviceId);
    }
    await delay(400);
  }

  log(
    "System",
    "simulation_complete",
    `Machine Economy Simulation complete — ${SIM_STEPS.length} M2M payments processed`,
    "info"
  );

  return allActivities;
}
