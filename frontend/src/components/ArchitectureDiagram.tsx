export default function ArchitectureDiagram() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">
        Architecture - x402 Payment Flow
      </h2>
      <div className="overflow-x-auto rounded-lg bg-black/40 p-6 font-mono text-xs text-gray-300">
        <pre className="whitespace-pre">
{`
┌─────────────┐     HTTP Request      ┌────────────────────┐
│             │ ───────────────────►  │                    │
│  IoT Device │                       │   MachineNet API   │
│  (Client)   │  ◄─── 402 Payment ── │   (Express + x402) │
│             │       Required        │                    │
└──────┬──────┘                       └─────────┬──────────┘
       │                                        │
       │  x402 Payment                          │  Verify TX
       │  (USDCx / sBTC)                        │
       │                                        │
┌──────▼──────────────────────────────────────────▼─────────┐
│                                                           │
│                   Stacks Blockchain                       │
│              (Testnet / Mainnet)                          │
│                                                           │
└───────────────────────────────────────────────────────────┘

Payment Flow:
  1. Device sends request to service endpoint
  2. Server returns HTTP 402 with payment instructions
  3. Device submits payment on Stacks (USDCx/sBTC)
  4. Device retries request with TX ID in header
  5. Server verifies payment and delivers service

Device Economy:
  🚗 Electric Car ──► ⚡ Charging Station ──► 📊 Energy Sensor
       │
       └──────────► 🅿️ Parking Meter
`}
        </pre>
      </div>
    </div>
  );
}
