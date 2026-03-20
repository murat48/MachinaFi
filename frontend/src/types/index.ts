export interface PaymentRecord {
  id: string;
  serviceId?: string;
  from?: string;
  to?: string;
  txId: string;
  amount: number;
  currency: string;
  status: "pending" | "verified" | "failed";
  timestamp: number;
}

export interface MachineService {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  price: number;
  currency: string;
  priceUnit: string;
  category: string;
  icon: string;
}

export interface DeviceActivity {
  id: string;
  deviceName: string;
  action: string;
  serviceId?: string;
  timestamp: number;
  details: string;
  type: "info" | "request" | "payment" | "response" | "service" | "error";
}
