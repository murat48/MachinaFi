import { requestService, log, sleep } from "./helpers";

/**
 * Charging Station Device Simulation
 *
 * This device:
 * 1. Buys energy price data from the Energy Sensor
 * 2. Pays 0.03 USDCx via x402
 * 3. Uses the data to set charging rates
 */
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  ⚡ Charging Station - Device Simulation  ");
  console.log("═══════════════════════════════════════════\n");

  log("Charging Station", "Initializing...");
  await sleep(500);

  log("Charging Station", "Need current energy prices to set rates...");
  await sleep(300);

  // Buy energy price data
  log("Charging Station", "Requesting energy price data...");
  const result = await requestService("/api/services/energy/price?sender=charging-station", "GET");

  if (result.status === 200) {
    log("Charging Station", `✅ Energy data received!`);
    log("Charging Station", `   Price/kWh: $${result.data.data.pricePerKwh}`);
    log("Charging Station", `   Region: ${result.data.data.region}`);
    log("Charging Station", `   Trend: ${result.data.data.trend}`);
    log("Charging Station", `   Adjusting charging rates accordingly...`);
  } else {
    log("Charging Station", `❌ Failed to get energy data`);
  }

  console.log("\n═══════════════════════════════════════════\n");
}

main().catch(console.error);
