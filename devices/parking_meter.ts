import { requestService, log, sleep } from "./helpers";

/**
 * Parking Meter Device Simulation
 *
 * Simulates a car paying a smart parking meter
 */
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  🅿️  Parking Meter - Device Simulation     ");
  console.log("═══════════════════════════════════════════\n");

  log("Smart Car", "Looking for parking...");
  await sleep(500);

  log("Smart Car", "Found Smart Parking Meter. Requesting 1 hour parking...");
  await sleep(300);

  const result = await requestService("/api/services/parking/pay", "POST", {
    vehicleId: "CAR-002",
    duration: 1,
  });

  if (result.status === 200) {
    log("Smart Car", `✅ Parking activated!`);
    log("Smart Car", `   Spot: ${result.data.spot}`);
    log("Smart Car", `   Duration: ${result.data.duration}`);
    log("Smart Car", `   Valid until: ${result.data.validUntil}`);
  } else {
    log("Smart Car", `❌ Parking payment failed`);
  }

  console.log("\n═══════════════════════════════════════════\n");
}

main().catch(console.error);
