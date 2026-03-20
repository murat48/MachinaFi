import { Request, Response, NextFunction } from "express";
import { getServiceById } from "../services/registry";
import { generatePaymentInstructions } from "../services/payment";

/**
 * x402 Payment Middleware
 *
 * Checks if a request includes a valid payment header.
 * If no payment is provided, responds with HTTP 402 Payment Required
 * along with x402 payment instructions.
 */
export function x402PaymentMiddleware(serviceId: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const service = getServiceById(serviceId);

    if (!service) {
      res.status(404).json({ error: "Service not found" });
      return;
    }

    // Check for x402 payment header
    const paymentHeader = req.headers["x-402-payment"] as string | undefined;
    const txId = req.headers["x-payment-txid"] as string | undefined;

    // If payment is present (either header), allow through
    if (paymentHeader || txId) {
      // Attach payment info to request for downstream verification
      (req as any).paymentTxId = txId || paymentHeader;
      (req as any).serviceId = serviceId;
      next();
      return;
    }

    // No payment provided - return 402 with instructions
    const instructions = generatePaymentInstructions(
      serviceId,
      service.price,
      service.currency as "USDCx" | "sBTC"
    );

    res.status(402).json({
      status: 402,
      message: "Payment Required",
      service: {
        id: service.id,
        name: service.name,
        price: service.price,
        currency: service.currency,
        priceUnit: service.priceUnit,
      },
      paymentInstructions: instructions,
    });
  };
}
