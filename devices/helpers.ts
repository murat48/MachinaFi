const API_BASE = process.env.API_BASE || "http://localhost:4000";

export async function requestService(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: Record<string, unknown>
): Promise<{ status: number; data: any }> {
  const url = `${API_BASE}${endpoint}`;
  console.log(`\n→ Requesting: ${method} ${url}`);

  // Step 1: Request without payment (expect 402)
  const initialRes = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(body || {}) : undefined,
  });

  const initialData = await initialRes.json();

  if (initialRes.status === 402) {
    console.log(`← 402 Payment Required`);
    console.log(`   Amount: ${initialData.service.price} ${initialData.service.currency}`);
    console.log(`   Receiver: ${initialData.paymentInstructions.receiver}`);

    // Step 2: Simulate payment
    const txId = `demo_${Date.now().toString(16)}`;
    console.log(`→ Submitting payment... TX: ${txId}`);

    // Step 3: Retry with payment header
    const paidRes = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Payment-TxId": txId,
      },
      body: method === "POST" ? JSON.stringify({ ...body, sender: "device-sim" }) : undefined,
    });

    const paidData = await paidRes.json();

    if (paidRes.ok) {
      console.log(`← ${paidRes.status} Success`);
      return { status: paidRes.status, data: paidData };
    } else {
      console.log(`← ${paidRes.status} Failed:`, paidData);
      return { status: paidRes.status, data: paidData };
    }
  }

  return { status: initialRes.status, data: initialData };
}

export function log(device: string, message: string): void {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] [${device}] ${message}`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
