import { PaymentRecord, DeviceActivity } from "../types";

// In-memory stores for demo purposes
const payments: PaymentRecord[] = [];
const activities: DeviceActivity[] = [];

let activityListeners: ((activity: DeviceActivity) => void)[] = [];

export function addPayment(payment: PaymentRecord): void {
  payments.push(payment);
}

export function getPayments(): PaymentRecord[] {
  return [...payments].sort((a, b) => b.timestamp - a.timestamp);
}

export function getPaymentByTxId(txId: string): PaymentRecord | undefined {
  return payments.find((p) => p.txId === txId);
}

export function updatePaymentStatus(
  txId: string,
  status: PaymentRecord["status"]
): void {
  const payment = payments.find((p) => p.txId === txId);
  if (payment) {
    payment.status = status;
  }
}

export function addActivity(activity: DeviceActivity): void {
  activities.push(activity);
  activityListeners.forEach((listener) => listener(activity));
}

export function getActivities(): DeviceActivity[] {
  return [...activities].sort((a, b) => b.timestamp - a.timestamp);
}

export function onActivity(
  listener: (activity: DeviceActivity) => void
): () => void {
  activityListeners.push(listener);
  return () => {
    activityListeners = activityListeners.filter((l) => l !== listener);
  };
}

export function clearAll(): void {
  payments.length = 0;
  activities.length = 0;
}
