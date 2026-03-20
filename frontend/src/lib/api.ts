const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function fetchServices() {
  const res = await fetch(`${API_BASE}/api/services`);
  if (!res.ok) throw new Error("Failed to fetch services");
  return res.json();
}

export async function fetchActivities() {
  const res = await fetch(`${API_BASE}/api/activities`);
  if (!res.ok) throw new Error("Failed to fetch activities");
  return res.json();
}

export async function fetchPayments() {
  const res = await fetch(`${API_BASE}/api/payments/history`);
  if (!res.ok) throw new Error("Failed to fetch payments");
  return res.json();
}

export async function refreshPayments() {
  const res = await fetch(`${API_BASE}/api/payments/refresh`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to refresh payments");
  return res.json();
}

export async function runSimulation() {
  const res = await fetch(`${API_BASE}/api/simulation/run`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to run simulation");
  return res.json();
}

export async function resetData() {
  const res = await fetch(`${API_BASE}/api/reset`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset");
  return res.json();
}

export async function requestServiceWithPayment(
  endpoint: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
) {
  // Step 1: Request without payment to get 402
  const initialRes = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(body || {}) : undefined,
  });

  const initialData = await initialRes.json();

  if (initialRes.status !== 402) {
    return { step: "direct", status: initialRes.status, data: initialData };
  }

  // Step 2: Simulate payment and retry
  const txId = `demo_${Date.now().toString(16)}`;

  const paidRes = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Payment-TxId": txId,
    },
    body:
      method === "POST"
        ? JSON.stringify({ ...body, sender: "dashboard-user" })
        : undefined,
  });

  const paidData = await paidRes.json();

  return {
    step: "paid",
    paymentInstructions: initialData.paymentInstructions,
    txId,
    status: paidRes.status,
    data: paidData,
  };
}

export function createWebSocket(): WebSocket | null {
  if (typeof window === "undefined") return null;
  const wsUrl =
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";
  return new WebSocket(wsUrl);
}
