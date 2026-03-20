import { requestService, log, sleep } from "./helpers";

/**
 * Electric Car Device Simulation
 *
 * This device:
 * 1. Requests a charging session from the EV Charging Station
 * 2. Pays 0.5 USDCx via x402
 * 3. Receives charging confirmation
 */
async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  🚗 Electric Car - Device Simulation  ");
  console.log("═══════════════════════════════════════\n");

  log("Electric Car", "Initializing...");
  await sleep(500);

  log("Electric Car", "Battery level: 15% - Need to charge!");
  await sleep(300);

  // Request charging service
  log("Electric Car", "Connecting to EV Charging Station...");
  const result = await requestService("/api/services/charge/start", "POST", {
    vehicleId: "EV-CAR-001",
    batteryLevel: 15,
  });

  if (result.status === 200) {
    log("Electric Car", `✅ Charging started!`);
    log("Electric Car", `   Session: ${result.data.sessionId}`);
    log("Electric Car", `   Duration: ${result.data.estimatedDuration}`);
    log("Electric Car", `   Power: ${result.data.powerOutput}`);
  } else {
    log("Electric Car", `❌ Failed to start charging`);
  }

  console.log("\n═══════════════════════════════════════\n");
}

main().catch(console.error);
