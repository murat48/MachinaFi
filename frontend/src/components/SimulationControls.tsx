"use client";

interface Props {
  onRun: () => void;
  onReset: () => void;
  running: boolean;
}

export default function SimulationControls({ onRun, onReset, running }: Props) {
  return (
    <div className="rounded-xl border border-brand-500/30 bg-brand-600/5 p-5">
      <h2 className="mb-2 text-lg font-semibold text-white">
        Machine Economy Simulation
      </h2>
      <p className="mb-4 text-sm text-gray-400">
        Trigger an automated device-to-device payment sequence demonstrating the
        x402 machine economy.
      </p>

      <div className="mb-4 rounded-lg bg-black/30 p-4 text-xs text-gray-300">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-brand-400">1.</span>
            <span>🚗 Electric Car → ⚡ Charging Station</span>
            <span className="ml-auto text-gray-500">0.50 USDCx</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-brand-400">2.</span>
            <span>⚡ Charging Station → 📊 Energy Sensor</span>
            <span className="ml-auto text-gray-500">0.03 USDCx</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-brand-400">3.</span>
            <span>🚗 Electric Car → 🅿️ Parking Meter</span>
            <span className="ml-auto text-gray-500">0.10 USDCx</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRun}
          disabled={running}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Running Simulation...
            </span>
          ) : (
            "▶ Run Machine Economy Simulation"
          )}
        </button>
        <button
          onClick={onReset}
          disabled={running}
          className="rounded-lg border border-white/10 px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-white/5 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
