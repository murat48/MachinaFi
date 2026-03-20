import { Router, Request, Response } from "express";
import { services } from "../services/registry";
import { getActivities, clearAll } from "../services/store";
import { runSimulation } from "../services/simulation";

const router = Router();

// List all available machine services
router.get("/services", (_req: Request, res: Response) => {
  res.json({ services });
});

// Get device activity log
router.get("/activities", (_req: Request, res: Response) => {
  const activities = getActivities();
  res.json({ activities, total: activities.length });
});

// Run the machine economy simulation
router.post("/simulation/run", async (_req: Request, res: Response) => {
  const activities = await runSimulation();
  res.json({
    status: "completed",
    message: "Machine Economy Simulation completed",
    steps: activities.length,
    activities,
  });
});

// Reset all data
router.post("/reset", (_req: Request, res: Response) => {
  clearAll();
  res.json({ status: "ok", message: "All data cleared" });
});

// Health check
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
