import { config } from "../config";
import { getAddressFromPrivateKey } from "@stacks/transactions";

const _networkName = config.stacks.network === "mainnet" ? "mainnet" : "testnet";

/**
 * Shared in-process nonce counter for the simulation wallet.
 *
 * Both USDCx transfers (simulation.ts) and register-payment contract calls
 * (payment.ts) go through this module so they never assign the same nonce.
 * Call resetNonce() at the start of each simulation run to re-sync with
 * the current chain state.
 */
let _nonce: number | null = null;

export async function acquireNonce(): Promise<number> {
  if (_nonce === null) {
    const privateKey = config.stacks.simPrivateKey;
    if (!privateKey) throw new Error("SIM_PRIVATE_KEY not set");

    const address = getAddressFromPrivateKey(privateKey, _networkName as any);
    const apiBase = config.stacks.apiUrl.replace(/\/$/, "");

    const res = await fetch(`${apiBase}/v2/accounts/${address}?proof=0`);
    if (!res.ok) throw new Error(`Failed to fetch nonce: ${res.status}`);
    const data = (await res.json()) as { nonce: number };
    let nonce = data.nonce;

    try {
      const mempoolRes = await fetch(
        `${apiBase}/extended/v1/tx/mempool?sender_address=${address}&limit=50`,
        { headers: { Accept: "application/json" } }
      );
      if (mempoolRes.ok) {
        const mempoolData = (await mempoolRes.json()) as {
          results: { nonce: number }[];
        };
        if (mempoolData.results?.length > 0) {
          const highest = Math.max(...mempoolData.results.map((tx) => tx.nonce));
          nonce = Math.max(nonce, highest + 1);
        }
      }
    } catch {
      // Fall back to confirmed nonce if mempool scan fails
    }

    _nonce = nonce;
  }

  // _nonce++ is synchronous — safe against concurrent async callers in the
  // single-threaded Node.js event loop once initialisation is complete.
  return _nonce++;
}

/** Reset the counter so the next acquireNonce() re-syncs from the chain. */
export function resetNonce(): void {
  _nonce = null;
}
