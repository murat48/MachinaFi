import { Router, Request, Response } from "express";
import { verifyPayment, refreshPendingPayments } from "../services/payment";
import { getPayments } from "../services/store";

const router = Router();

// Verify a payment transaction
router.post("/verify", async (req: Request, res: Response) => {
  const { txId, amount, currency, sender, serviceId } = req.body;

  if (!txId || !amount || !currency) {
    res.status(400).json({ error: "Missing required fields: txId, amount, currency" });
    return;
  }

  const result = await verifyPayment(txId, amount, currency, sender || "unknown", serviceId);
  res.json(result);
});

// Get payment history
router.get("/history", (_req: Request, res: Response) => {
  const payments = getPayments();
  res.json({ payments, total: payments.length });
});

// Trigger an immediate re-check of all pending transactions
router.post("/refresh", async (_req: Request, res: Response) => {
  await refreshPendingPayments();
  const payments = getPayments();
  res.json({ payments, total: payments.length });
});

export default router;
