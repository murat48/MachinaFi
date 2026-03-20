import { Router, Request, Response } from "express";
import { x402PaymentMiddleware } from "../middleware/x402";
import { verifyPayment } from "../services/payment";
import { addActivity } from "../services/store";
import { getServiceById } from "../services/registry";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// EV Charging Station
router.post(
  "/charge/start",
  x402PaymentMiddleware("ev-charging"),
  async (req: Request, res: Response) => {
    const txId = (req as any).paymentTxId;

    const result = await verifyPayment(txId, 0.5, "USDCx", req.body.sender || "unknown", "ev-charging");

    if (!result.verified) {
      res.status(400).json({ error: "Payment verification failed", message: result.message });
      return;
    }

    addActivity({
      id: uuidv4(),
      deviceName: "EV Charging Station",
      action: "charging_started",
      serviceId: "ev-charging",
      timestamp: Date.now(),
      details: `Charging session started. TX: ${txId}`,
      type: "service",
    });

    res.json({
      status: "success",
      service: "ev-charging",
      message: "Charging session started",
      sessionId: uuidv4(),
      estimatedDuration: "45 minutes",
      powerOutput: "150kW",
      txId,
    });
  }
);

// Smart Parking Meter
router.post(
  "/parking/pay",
  x402PaymentMiddleware("smart-parking"),
  async (req: Request, res: Response) => {
    const txId = (req as any).paymentTxId;

    const result = await verifyPayment(txId, 0.1, "USDCx", req.body.sender || "unknown", "smart-parking");

    if (!result.verified) {
      res.status(400).json({ error: "Payment verification failed", message: result.message });
      return;
    }

    addActivity({
      id: uuidv4(),
      deviceName: "Smart Parking Meter",
      action: "parking_activated",
      serviceId: "smart-parking",
      timestamp: Date.now(),
      details: `Parking activated for 1 hour. TX: ${txId}`,
      type: "service",
    });

    res.json({
      status: "success",
      service: "smart-parking",
      message: "Parking activated",
      duration: "1 hour",
      spot: `P-${Math.floor(Math.random() * 100) + 1}`,
      validUntil: new Date(Date.now() + 3600000).toISOString(),
      txId,
    });
  }
);

// Energy Price Sensor
router.get(
  "/energy/price",
  x402PaymentMiddleware("energy-sensor"),
  async (req: Request, res: Response) => {
    const txId = (req as any).paymentTxId;

    const result = await verifyPayment(txId, 0.03, "USDCx", (req.query.sender as string) || "unknown", "energy-sensor");

    if (!result.verified) {
      res.status(400).json({ error: "Payment verification failed", message: result.message });
      return;
    }

    addActivity({
      id: uuidv4(),
      deviceName: "Energy Price Sensor",
      action: "data_served",
      serviceId: "energy-sensor",
      timestamp: Date.now(),
      details: `Energy price data served. TX: ${txId}`,
      type: "service",
    });

    res.json({
      status: "success",
      service: "energy-sensor",
      data: {
        pricePerKwh: (0.08 + Math.random() * 0.12).toFixed(4),
        currency: "USD",
        region: "US-WEST",
        timestamp: new Date().toISOString(),
        trend: Math.random() > 0.5 ? "rising" : "falling",
        source: "IoT Grid Sensor Network",
      },
      txId,
    });
  }
);

// Weather Sensor
router.get(
  "/weather",
  x402PaymentMiddleware("weather-sensor"),
  async (req: Request, res: Response) => {
    const txId = (req as any).paymentTxId;

    const result = await verifyPayment(txId, 0.02, "USDCx", (req.query.sender as string) || "unknown", "weather-sensor");

    if (!result.verified) {
      res.status(400).json({ error: "Payment verification failed", message: result.message });
      return;
    }

    addActivity({
      id: uuidv4(),
      deviceName: "Weather Sensor",
      action: "data_served",
      serviceId: "weather-sensor",
      timestamp: Date.now(),
      details: `Weather data served. TX: ${txId}`,
      type: "service",
    });

    res.json({
      status: "success",
      service: "weather-sensor",
      data: {
        temperature: (15 + Math.random() * 20).toFixed(1),
        humidity: (40 + Math.random() * 40).toFixed(1),
        pressure: (1010 + Math.random() * 20).toFixed(1),
        windSpeed: (0 + Math.random() * 30).toFixed(1),
        conditions: ["Clear", "Cloudy", "Partly Cloudy", "Rain"][Math.floor(Math.random() * 4)],
        timestamp: new Date().toISOString(),
        sensorId: "WS-IOT-0042",
      },
      txId,
    });
  }
);

export default router;
