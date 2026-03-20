import { MachineService } from "../types";

export const services: MachineService[] = [
  {
    id: "ev-charging",
    name: "EV Charging Station",
    description: "High-speed electric vehicle charging service. Pay per session.",
    endpoint: "/api/services/charge/start",
    method: "POST",
    price: 0.5,
    currency: "USDCx",
    priceUnit: "per session",
    category: "Energy",
    icon: "⚡",
  },
  {
    id: "smart-parking",
    name: "Smart Parking Meter",
    description: "Automated parking space reservation and payment.",
    endpoint: "/api/services/parking/pay",
    method: "POST",
    price: 0.1,
    currency: "USDCx",
    priceUnit: "per hour",
    category: "Transport",
    icon: "🅿️",
  },
  {
    id: "energy-sensor",
    name: "Energy Price Sensor",
    description: "Real-time electricity pricing data for smart grid operations.",
    endpoint: "/api/services/energy/price",
    method: "GET",
    price: 0.03,
    currency: "USDCx",
    priceUnit: "per request",
    category: "Data",
    icon: "📊",
  },
  {
    id: "weather-sensor",
    name: "Weather Sensor",
    description: "Hyperlocal weather data from IoT sensor network.",
    endpoint: "/api/services/weather",
    method: "GET",
    price: 0.02,
    currency: "USDCx",
    priceUnit: "per request",
    category: "Data",
    icon: "🌤️",
  },
];

export function getServiceById(id: string): MachineService | undefined {
  return services.find((s) => s.id === id);
}
