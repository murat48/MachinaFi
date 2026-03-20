import { requestService, log, sleep } from "./helpers";

/**
 * Energy Sensor Client Simulation
 *
 * Queries weather data from another IoT sensor
 */
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  📊 Energy Sensor - Device Simulation     ");
  console.log("═══════════════════════════════════════════\n");

  log("Energy Sensor", "Initializing sensor calibration...");
  await sleep(500);

  log("Energy Sensor", "Fetching weather data to improve predictions...");
  await sleep(300);

  const result = await requestService("/api/services/weather?sender=energy-sensor", "GET");

  if (result.status === 200) {
    log("Energy Sensor", `✅ Weather data received!`);
    log("Energy Sensor", `   Temperature: ${result.data.data.temperature}°C`);
    log("Energy Sensor", `   Humidity: ${result.data.data.humidity}%`);
    log("Energy Sensor", `   Conditions: ${result.data.data.conditions}`);
    log("Energy Sensor", `   Updating energy price model...`);
  } else {
    log("Energy Sensor", `❌ Failed to get weather data`);
  }

  console.log("\n═══════════════════════════════════════════\n");
}

main().catch(console.error);
