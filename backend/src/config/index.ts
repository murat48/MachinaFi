import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  stacks: {
    network: process.env.STACKS_NETWORK || "testnet",
    apiUrl: process.env.STACKS_API_URL || "https://api.testnet.hiro.so",
    paymentReceiver: process.env.PAYMENT_RECEIVER_ADDRESS || "",
    // Private key for automated M2M simulation payments
    simPrivateKey: process.env.SIM_PRIVATE_KEY || "",
  },
  tokens: {
    usdcx: {
      contractAddress: process.env.USDCX_CONTRACT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
      contractName: process.env.USDCX_CONTRACT_NAME || "usdcx",
      tokenName: "usdcx-token",
    },
  },
  machinenetContract: {
    address: process.env.MACHINENET_CONTRACT_ADDRESS || "ST25N21KYZQS7GA900PC67VVBHB597EFGZFPX55PN",
    name: process.env.MACHINENET_CONTRACT_NAME || "machinenet-payment",
  },
};
