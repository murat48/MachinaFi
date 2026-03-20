import { STACKS_NETWORK } from "@/context/WalletContext";
import { openContractCall } from "@stacks/connect";
import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";
import { principalCV, uintCV, noneCV } from "@stacks/transactions";

const PAYMENT_RECEIVER =
  process.env.NEXT_PUBLIC_PAYMENT_RECEIVER ||
  "ST25N21KYZQS7GA900PC67VVBHB597EFGZFPX55PN";

// Testnet USDCx SIP-010 contract
const USDCX_CONTRACT_TESTNET = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const USDCX_CONTRACT_MAINNET =
  process.env.NEXT_PUBLIC_USDCX_CONTRACT_ADDRESS || "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9";

const network = STACKS_NETWORK === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;

/**
 * Opens Leather / Xverse wallet for USDCx (SIP-010) transfer.
 * Uses @stacks/connect - official Stacks wallet SDK.
 */
export async function makeServicePayment(
  serviceId: string,
  amount: number,
  receiverAddress: string,
  senderAddress: string
): Promise<string> {
  const recipient = receiverAddress || PAYMENT_RECEIVER;
  const amountMicroStx = BigInt(Math.max(1, Math.floor(amount * 1_000_000)));
  const contractAddress = STACKS_NETWORK === "mainnet" ? USDCX_CONTRACT_MAINNET : USDCX_CONTRACT_TESTNET;
  const contractName = STACKS_NETWORK === "mainnet" ? "token-usdcx" : "usdcx";

  console.log("[Payment] Initiating transfer:", {
    serviceId,
    amount,
    sender: senderAddress,
    recipient,
    contract: `${contractAddress}.${contractName}`,
  });

  return new Promise((resolve, reject) => {
    try {
      // Post-condition: sender sends exactly `amount` USDCx tokens
      const postCondition = {
        type: "ft-postcondition" as const,
        address: senderAddress,
        condition: "eq" as const,
        asset: `${contractAddress}.${contractName}::usdcx-token` as const,
        amount: amountMicroStx,
      };

      openContractCall({
        network,
        contractAddress,
        contractName,
        functionName: "transfer",
        stxAddress: senderAddress,
        postConditions: [postCondition],
        // SIP-010: (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)))
        functionArgs: [
          uintCV(amountMicroStx),
          principalCV(senderAddress),
          principalCV(recipient),
          noneCV(),
        ],
        appDetails: {
          name: "MachineNet Payment",
          icon: window.location.origin + "/logo.png",
        },
        onFinish: (data) => {
          console.log("[Payment] Transaction submitted:", data.txId);
          resolve(data.txId);
        },
        onCancel: () => {
          console.log("[Payment] User cancelled transaction");
          reject(new Error("Transaction cancelled by user"));
        },
      });
    } catch (err: unknown) {
      console.error("[Payment] openContractCall error:", err);
      reject(err);
    }
  });
}
