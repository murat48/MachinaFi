import { requestService, log, sleep } from "./helpers";

/**
 * Full Machine Economy Simulation
 *
 * Runs the complete device-to-device economy scenario:
 * 1. Electric Car → Charging Station (pays for charging)
 * 2. Charging Station → Energy Sensor (pays for price data)
 * 3. Electric Car → Parking Meter (pays for parking)
 */
async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  MachineNet - Full Economy Simulation        ║");
  console.log("║  Device-to-Device Payment Demo               ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // Scenario 1: Electric Car → Charging Station
  console.log("━━━ Scenario 1: Electric Car → Charging Station ━━━\n");
  log("Electric Car", "Battery at 15%. Need to charge!");
  await sleep(500);

  log("Electric Car", "Requesting charging session...");
  const chargeResult = await requestService("/api/services/charge/start", "POST", {
    vehicleId: "EV-CAR-001",
    batteryLevel: 15,
  });

  if (chargeResult.status === 200) {
    log("Electric Car", `✅ Charging started! Session: ${chargeResult.data.sessionId}`);
  }
  await sleep(1000);

  // Scenario 2: Charging Station → Energy Sensor
  console.log("\n━━━ Scenario 2: Charging Station → Energy Sensor ━━━\n");
  log("Charging Station", "Fetching energy prices to optimize rates...");
  await sleep(500);

  const energyResult = await requestService("/api/services/energy/price?sender=charging-station", "GET");

  if (energyResult.status === 200) {
    log("Charging Station", `✅ Energy price: $${energyResult.data.data.pricePerKwh}/kWh (${energyResult.data.data.trend})`);
  }
  await sleep(1000);

  // Scenario 3: Electric Car → Parking Meter
  console.log("\n━━━ Scenario 3: Electric Car → Parking Meter ━━━\n");
  log("Electric Car", "Parking for 1 hour while charging...");
  await sleep(500);

  const parkResult = await requestService("/api/services/parking/pay", "POST", {
    vehicleId: "EV-CAR-001",
    duration: 1,
  });

  if (parkResult.status === 200) {
    log("Electric Car", `✅ Parking activated at spot ${parkResult.data.spot}`);
  }
  await sleep(500);

  // Summary
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  Simulation Complete!                         ║");
  console.log("║                                               ║");
  console.log("║  Transactions executed:                        ║");
  console.log("║  • EV Car → Charging Station:  0.50 USDCx     ║");
  console.log("║  • Charging → Energy Sensor:   0.03 USDCx     ║");
  console.log("║  • EV Car → Parking Meter:     0.10 USDCx     ║");
  console.log("║  ─────────────────────────────                 ║");
  console.log("║  Total economy volume:         0.63 USDCx     ║");
  console.log("╚══════════════════════════════════════════════╝\n");
}

main().catch(console.error);
